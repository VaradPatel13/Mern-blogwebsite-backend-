// routes/user.routes.js
import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  // getPublicUserProfile,
  // followUser,
  // unfollowUser,
  // saveBlog,
  // unsaveBlog
} from "../controllers/user.controllers.js";
import authenticateUser from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";
import User from "../models/user.model.js";

const router = express.Router();

// ✅ Auth routes
router.post("/signup", upload.single("profileImage"), registerUser);
router.post("/login", loginUser);
router.post("/logout", authenticateUser, logoutUser);

// ✅ Get current logged-in user
router.get("/me", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      ...user.toObject(),
      profileImage: user.profileImage || null,
    });
  } catch (err) {
    console.error("Error fetching current user:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Public profile
// router.get("/:id", getPublicUserProfile);

// // ✅ Follow/Unfollow routes
// router.post("/:targetUserId/follow", authenticateUser, followUser);
// router.post("/:targetUserId/unfollow", authenticateUser, unfollowUser);

// // ✅ Save/Unsave blog routes
// router.post("/blogs/:blogId/save", authenticateUser, saveBlog);
// router.delete("/blogs/:blogId/save", authenticateUser, unsaveBlog);

export default router;
