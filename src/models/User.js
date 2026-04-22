import mongoose from "mongoose";
import { sanitizePlugin } from "../utils/mongooseSanitize.js";

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
    },

    firstName: String,
    lastName: String,

    password: {
      type: String,
    },

    role: {
      type: String,
      enum: ["customer", "driver"],
      default: "customer",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: String,
    otpExpires: Date,

    otpAttempts: {
      type: Number,
      default: 0,
    },
    
    otpResendCount: {
      type: Number,
      default: 0,
    },
    
    otpLastSentAt: Date,
    
    otpLockedUntil: Date,

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    deletedAt: {
      type: Date,
      default: null,
    },
  
    
  },
  { timestamps: true }
);

userSchema.plugin(sanitizePlugin, {
  hidden: [
    "password",
    "otp",
    "otpExpires",
    "otpAttempts",
    "otpResendCount",
    "otpLastSentAt",
    "otpLockedUntil",
    "__v",
    "deletedAt",
    "isDeleted"
  ],
});

userSchema.index({ location: "2dsphere" });

export default mongoose.model("User", userSchema);