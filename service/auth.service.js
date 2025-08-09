import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const secretKey = process.env.JWT_SECRET;
const tokenExpiry = process.env.JWT_EXPIRATION || "1h";

if (!secretKey) {
    throw new Error("❌ FATAL ERROR: JWT_SECRET is not defined in the environment variables");
}

export const generateToken = (user) => {
    try {
        return jwt.sign(
            {
                id: user._id.toString(),
                role: user.role,
            },
            secretKey,
            { expiresIn: tokenExpiry }
        );
    } catch (error) {
        console.error("JWT generation error:", error.message);
        return null;
    }
};


export const verifyToken = (token) => {
    try {
        return jwt.verify(token, secretKey);
    } catch (error) {
        console.warn("JWT verification failed:", error.message);
        return null;
    }
};
