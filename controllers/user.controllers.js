import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { generateToken } from "../service/auth.service.js";
import imagekit from "../service/imagekit.service.js";


export const registerUser = async (req, res) => {
  try {
    const { fullName, email, mobileNumber, password, role } = req.body;

    console.log("📥 Incoming registration data:", { fullName, email, mobileNumber, role });

    // ✅ Validate required fields
    if (!fullName || !email || !mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all fields."
      });
    }

    // ✅ Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists."
      });
    }

    // ✅ Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Default profile image
    let profileImageUrl = "https://ik.imagekit.io/neg1amxgpy/Profile_Pic/default_awtar_MDnC7hgbv?updatedAt=1754414667374";

    // ✅ DEBUG: Check file existence
    if (!req.file) {
      console.warn("⚠️ No profile image file found in request.");
    } else {
      console.log("🖼️ Image file received:");
      console.log(" - originalname:", req.file.originalname);
      console.log(" - mimetype:", req.file.mimetype);
      console.log(" - size:", req.file.size);
      console.log(" - buffer:", req.file.buffer ? `✅ buffer length: ${req.file.buffer.length}` : "❌ No buffer");

      try {
        // ✅ Try uploading image to ImageKit
        const uploadedImage = await imagekit.upload({
          file: req.file.buffer,
          fileName: `profile_${Date.now()}_${req.file.originalname}`,
          folder: "bolify/users"
        });

        profileImageUrl = uploadedImage.url;
        console.log("✅ Image uploaded successfully:", profileImageUrl);

      } catch (imgErr) {
        console.error("❌ ImageKit Upload Error:", JSON.stringify(imgErr, null, 2));
        return res.status(500).json({
          success: false,
          message: "Image upload failed. Please try again.",
          error: imgErr?.message || imgErr
        });
      }
    }

    // ✅ Create user in database
    const newUser = await User.create({
      fullName,
      email,
      mobileNumber,
      password: hashedPassword,
      role,
      profileImage: profileImageUrl
    });

    console.log("✅ New user created:", newUser._id);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      userId: newUser._id,
      profileImage: profileImageUrl
    });

  } catch (error) {
    console.error("❌ Register error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message || error
    });
  }
};


export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        // ✅ Check if user exists
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password." });
        }

        // ✅ Compare password
        const isMatch = bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password." });
        }

        // ✅ Generate token
        const token = generateToken(user);

        // ✅ Set secure cookie
        res.cookie("authToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            maxAge: 60 * 60 * 1000, // 1 hour
            path: "/",
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                mobileNumber: user.mobileNumber,
                role: user.role,
                profileImage: user.profileImage,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ success: false, message: "Server error during login" });
    }
};

export const logoutUser = async (req, res) => {
    try {
        res.clearCookie("authToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax"
        });
        return res.status(200).json({ success: true, message: "Logout successful" });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ success: false, message: "Server error during logout" });
    }
};

