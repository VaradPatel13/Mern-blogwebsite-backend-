import jwt from "jsonwebtoken";


const authenticateUser = (req, res, next) => {
    try {
        // Retrieve token from cookie or Authorization header
        const token =
            req.cookies?.authToken ||
            (req.headers.authorization && req.headers.authorization.split(" ")[1]);

        if (!token) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Ensure decoded token has valid structure
        if (!decoded.id) {
            return res.status(403).json({ success: false, message: "Invalid token payload" });
        }

        req.user = decoded; // Attach user info to request
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message);

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Session expired, please log in again" });
        }

        return res.status(403).json({ success: false, message: "Invalid or malformed token" });
    }
};

export default authenticateUser;