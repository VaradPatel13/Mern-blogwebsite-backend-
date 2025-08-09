import multer from "multer";

// ✅ Store files in memory for direct upload to ImageKit
const storage = multer.memoryStorage();

// ✅ Limit file size to 5MB and allow only image files
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            const error = new Error("Only image files are allowed (jpg, jpeg, png, webp).");
            error.code = "INVALID_FILE_TYPE";
            cb(error, false);
        }
    }
});

// ✅ Custom error handler for multer
export const multerErrorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Handle multer-specific errors (e.g., file too large)
        return res.status(400).json({ success: false, message: err.message });
    } else if (err.code === "INVALID_FILE_TYPE") {
        return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
};

export default upload;
