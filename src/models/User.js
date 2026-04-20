import mongoose from "mongoose";

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
  
    
  },
  { timestamps: true }
);

userSchema.index({ location: "2dsphere" });

export default mongoose.model("User", userSchema);