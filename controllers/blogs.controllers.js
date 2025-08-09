import Blog from '../models/blog.model.js';
import mongoose from 'mongoose';
import imagekit from "../service/imagekit.service.js";


export const handleCreateBlog = async (req, res) => {
    try {
        const { title, body } = req.body;
        const createdBy = req.user?.id;

        if (!title || !body) {
            return res.status(400).json({ success: false, message: "Title and body are required." });
        }
        if (!createdBy) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        // ✅ Upload image if provided
        let coverImageUrl = "https://ik.imagekit.io/neg1amxgpy/Profile_Pic/default_awtar_MDnC7hgbv?updatedAt=1754414667374";
        if (req.file) {
            const uploadedImage = await imagekit.upload({
                file: req.file.buffer,
                fileName: `blog_${Date.now()}_${req.file.originalname}`,
                folder: "bolify/blogs"
            });
            coverImageUrl = uploadedImage.url;
        }

        const newBlog = await Blog.create({ title, createdBy, coverImage: coverImageUrl, body });

        return res.status(201).json({
            success: true,
            message: "Blog created successfully",
            data: newBlog
        });
    } catch (error) {
        console.error("❌ Blog creation error:", error);
        if (error.name === "ValidationError") {
            return res.status(422).json({ success: false, message: "Validation failed", errors: error.errors });
        }
        return res.status(500).json({ success: false, message: "Server error while creating blog" });
    }
};

/**
 * @desc Get a single blog by ID
 */
export const handleReadBlog = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid Blog ID format" });
        }

        const blog = await Blog.findById(id).populate("createdBy", "fullName email profileImage");
        if (!blog) {
            return res.status(404).json({ success: false, message: "Blog not found" });
        }

        return res.status(200).json({ success: true, data: blog });
    } catch (error) {
        console.error("Error in handleReadBlog:", error);
        return res.status(500).json({ success: false, message: "Server error while fetching blog" });
    }
};

/**
 * @desc Delete a blog (only owner can delete) and remove image from ImageKit
 */
export const handleDeleteBlog = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid Blog ID format" });
        }

        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({ success: false, message: "Blog not found" });
        }

        if (!req.user || blog.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Unauthorized: You cannot delete this blog" });
        }

        // ✅ Delete image from ImageKit if exists
        if (blog.coverImage && !blog.coverImage.includes("default-blog-cover.png")) {
            try {
                const fileId = blog.coverImage.split("/").pop(); // Extract file name
                await imagekit.deleteFile(fileId);
            } catch (err) {
                console.warn("⚠️ Failed to delete image from ImageKit:", err.message);
            }
        }

        await blog.deleteOne();
        return res.status(200).json({ success: true, message: "Blog deleted successfully" });
    } catch (error) {
        console.error("Error in handleDeleteBlog:", error);
        return res.status(500).json({ success: false, message: "Server error while deleting blog" });
    }
};

/**
 * @desc Get all blogs by a specific user
 */
export const handleAllBlogsCreatedByUser = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        const [blogs, totalBlogs] = await Promise.all([
            Blog.find({ createdBy: userId })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(Number(limit)),
            Blog.countDocuments({ createdBy: userId })
        ]);

        return res.status(200).json({
            success: true,
            count: blogs.length,
            total: totalBlogs,
            currentPage: Number(page),
            totalPages: Math.ceil(totalBlogs / limit),
            data: blogs
        });
    } catch (error) {
        console.error("Error in handleAllBlogsCreatedByUser:", error);
        return res.status(500).json({ success: false, message: "Server error while fetching blogs" });
    }
};

/**
 * @desc Get all blogs (paginated)
 */
export const handleAllCreatedBlogs = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const [blogs, totalBlogs] = await Promise.all([
            Blog.find()
                .populate("createdBy", "fullName profileImage")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(Number(limit)),
            Blog.countDocuments()
        ]);

        return res.status(200).json({
            success: true,
            count: blogs.length,
            total: totalBlogs,
            currentPage: Number(page),
            totalPages: Math.ceil(totalBlogs / limit),
            data: blogs
        });
    } catch (error) {
        console.error("Error in handleAllCreatedBlogs:", error);
        return res.status(500).json({ success: false, message: "Server error while fetching blogs" });
    }
};


export const incrementViews = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id; // or use IP for anonymous users

    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    // If user already viewed, do not increment
    if (blog.viewedBy.includes(userId)) {
      return res.status(200).json({ message: 'Already viewed', blog });
    }

    blog.views += 1;
    blog.viewedBy.push(userId);
    await blog.save();

    res.status(200).json({ message: 'View incremented', blog });
  } catch (err) {
    res.status(500).json({ message: 'Error incrementing views', error: err.message });
  }
};


export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    const alreadyLiked = blog.likedBy.includes(userId);

    if (alreadyLiked) {
      blog.likes -= 1;
      blog.likedBy = blog.likedBy.filter(uid => uid.toString() !== userId.toString());
    } else {
      blog.likes += 1;
      blog.likedBy.push(userId);
    }

    await blog.save();

    res.status(200).json({ message: alreadyLiked ? 'Unliked' : 'Liked', blog });
  } catch (err) {
    res.status(500).json({ message: 'Error toggling like', error: err.message });
  }
};


export const addComment = async (req, res) => {
  try {
    const { id } = req.params; // Blog ID
    const { text } = req.body;
    const userId = req.user._id; // Assumes user is authenticated and req.user is populated

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const newComment = { user: userId, text };
    blog.comments.push(newComment);
    await blog.save();

    res.status(200).json({ message: 'Comment added successfully', blog });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add comment', error: err.message });
  }
};
