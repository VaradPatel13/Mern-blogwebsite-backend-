import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import connectDB from './dp.config.js';
import userRoutes from './routes/user.route.js';
import blogRoutes from './routes/blog.route.js';
import authRoutes from './routes/auth.route.js';
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Connect to MongoDB before starting server
connectDB()

// ✅ Middleware
app.use(express.json({ limit: '10mb' })); // increase limit for JSON body
app.use(express.urlencoded({ limit: '10mb', extended: true })); // increase limit for form data
app.use(cookieParser());
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false
}));
app.use(morgan("combined"));

// ✅ Rate Limiting (Prevent brute-force attacks)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

// ✅ CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL?.split(",") || ["http://localhost:5173"],
  credentials: true,
}));

// ✅ Routes
app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the Bolify API" });
});

app.use("/api/users", userRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/auth", authRoutes);


// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);
  res.status(500).json({
    error: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message
  });
});


app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
