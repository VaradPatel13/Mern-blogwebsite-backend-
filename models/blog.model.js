import { Schema, model } from 'mongoose';

const commentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      minlength: [1, 'Comment cannot be empty']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const blogSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters long"],
      maxlength: [120, "Title cannot exceed 120 characters"]
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    coverImage: {
      type: String,
      default: 'https://ik.imagekit.io/your-imagekit-id/default-blog-cover.png',
      validate: {
        validator: function (v) {
          return /^https?:\/\/[^\s]+$/.test(v);
        },
        message: "Please provide a valid cover image URL"
      }
    },
    body: {
      type: String,
      required: [true, "Blog content is required"],
      minlength: [40, "Blog content must be at least 40 characters long"]
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published"
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (arr) {
          return arr.every(tag => typeof tag === "string" && tag.length > 0);
        },
        message: "Tags must be non-empty strings"
      }
    },
    viewedBy: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
      }],
    likedBy: [{
       type: Schema.Types.ObjectId, 
       ref: 'User' 
      }],
    comments: {
      type: [commentSchema],
      default: []
    }
  },
  { timestamps: true }
);

// ✅ Add index for faster blog search
blogSchema.index({ title: "text", body: "text" });

const Blog = model("Blog", blogSchema);

export default Blog;
