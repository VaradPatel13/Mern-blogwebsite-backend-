import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/user.model.js';
import { generateToken } from '../service/auth.service.js' // Make sure this function exists

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
router.post('/google-login', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "Invalid token" });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        fullName: name,
        email,
        profileImage: picture,
        googleId,
        role: 'user',
      });
      await user.save();
    }

    const jwtToken = generateToken(user);

    console.log("User in Google Login:", user);
    console.log("JWT in Google Login:", jwtToken);

    if (!jwtToken) {
      console.error("JWT Token not generated");
      return res.status(500).json({ error: "Token generation failed" });
    }

    res.cookie("authToken", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 60 * 60 * 1000,
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
    console.error('Google login error:', error);
    res.status(401).json({ error: 'Google authentication failed' });
  }
});


// app.post('/google-login', async (req, res) => {
//   const { credential } = req.body;
//   try {
//     const ticket = await client.verifyIdToken({
//       idToken: credential,
//       audience: process.env.GOOGLE_CLIENT_ID,
//     });

//     const payload = ticket.getPayload();
//     const { email, name, picture } = payload;

//     let user = await User.findOne({ email });
//     if (!user) {
//       user = await User.create({
//         fullName: name,
//         email,
//         profileImage: picture,
//         password: '', // Not used
//         role: 'user',
//       });
//     }

//     // Optional: create session or JWT
//     res.status(200).json({ user });
//   } catch (err) {
//     console.error(err);
//     res.status(401).json({ message: 'Google verification failed' });
//   }
// });


export default router;
