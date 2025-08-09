import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [3, "Full name must be at least 3 characters long"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"]
    },
    mobileNumber: {
      type: String,
      // Optional for Google users
      match: [/^\d{10}$/, 'Mobile number must be exactly 10 digits.'],
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters long"],
      select: false ,// Don't return in queries
      required: function () {
        return !this.googleId; // Only require password if not a Google user
      },
    },
    googleId: {
      type: String, // Only set for Google-auth users
      unique: true,
      sparse: true, // Allows multiple nulls
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local'
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user'
    },
    profileImage: {
      type: String,
      default: process.env.DEFAULT_AVATAR_URL || 'https://ik.imagekit.io/default-avatar.png',
      validate: {
        validator: v => /^https?:\/\/[^\s]+$/.test(v),
        message: "Please provide a valid image URL"
      }
    }
  },
  { timestamps: true }
);

// ✅ Hash password before save for local users
userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.authProvider === 'local') {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// ✅ Hide sensitive fields in response
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

const User = model('User', userSchema);

export default User;
