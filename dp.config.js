import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODBURL, {
            // Optional: useNewUrlParser, useUnifiedTopology (Mongoose v6+ sets defaults)
        });
        console.log("✅ MongoDB Connected Successfully!");
    } catch (error) {
        console.error("❌ MongoDB Connection Failed:", error.message);
        process.exit(1); 
    }
};

export default connectDB;
