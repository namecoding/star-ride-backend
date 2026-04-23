import mongoose from "mongoose";

const rideSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
    },

    pickup: String,

    destination: String,

    pickupCoords: {
      latitude: Number,
      longitude: Number,
    },

    destinationCoords: {
      latitude: Number,
      longitude: Number,
    },

    rideType: {
      id: String,
      name: String,
      price: Number,
      seats: Number,
    },

    distanceInMeters: Number,

    paymentMethod: {
      type: String,
      enum: ["cash", "card"],
      default: "cash",
    },

    cancelledBy: {
      type: String,
      enum: ["customer", "driver"],
    },
    
    cancelReason: {
      type: String,
      default: "",
    },
    
    cancelledAt: Date,

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "arriving",
        "arrived",
        "ongoing",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
    startedAt: Date,
    completedAt: Date,
    arrivedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Ride", rideSchema);