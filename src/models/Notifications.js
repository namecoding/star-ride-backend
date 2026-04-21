import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    userType: {
      type: String,
      enum: ["customer", "driver"],
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["ride", "promo", "system"],
      default: "system",
      index: true,
    },

    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    priority: {
        type: String,
        enum: ["low", "normal", "high"],
        default: "normal",
      },
      
      action: {
        type: String, // e.g. "OPEN_RIDE", "VIEW_PROMO"
      },
  },
  {
    timestamps: true,
  }
);

// Useful compound index for fast queries
NotificationSchema.index({ userId: 1, userType: 1, read: 1 });

export default mongoose.model("Notification", NotificationSchema);