import express from "express";
import { registerUser, loginUser, logoutUser } from "../controllers/user.controllers.js";
import authenticateUser from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";


const router = express.Router();

router.post("/signup", upload.single("profileImage"), registerUser);
router.post("/login", loginUser);
router.post("/logout", authenticateUser, logoutUser);

export default router;
