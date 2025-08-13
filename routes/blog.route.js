import express from 'express';
import {
    handleCreateBlog,
    handleAllBlogsCreatedByUser,
    handleDeleteBlog,
    handleReadBlog,
    handleAllCreatedBlogs,
    toggleLike,
    incrementViews,
    addComment
} from '../controllers/blogs.controllers.js';
import authenticateUser from '../middleware/auth.middleware.js';
import upload, { multerErrorHandler } from "../middleware/multer.middleware.js";

const router = express.Router();


router.get("/blogs", handleAllCreatedBlogs);
router.get("/:id", handleReadBlog);

// Blog routes
router.post("/create",authenticateUser,upload.single("coverImage"),multerErrorHandler,  handleCreateBlog);
router.get("/user/blogs",authenticateUser,handleAllBlogsCreatedByUser);

router.delete("/:id",authenticateUser,handleDeleteBlog);


router.patch('/:id/views', incrementViews);
router.patch('/:id/likes', authenticateUser ,toggleLike);
router.post('/:id/comments',authenticateUser,addComment);

export default router;
