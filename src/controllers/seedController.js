import RideType from "../models/RideType.js";
import WalletTransaction from "../models/WalletTransaction.js";
import User from "../models/User.js";

export const seedRideTypes = async (req, res) => {
  try {
    const existing = await RideType.countDocuments();

    if (existing > 0) {
      return res.json({
        message: "Ride types already seeded",
      });
    }

    const rideTypes = [
      {
        id: "economy",
        name: "Economy",
        subtitle: "Affordable everyday rides",
        seats: 4,
        basePrice: 1500,
        pricePerKm: 600,
        image: "ride.png",
        isActive: true,
      },
      {
        id: "premium",
        name: "Premium",
        subtitle: "More space, smoother ride",
        seats: 4,
        basePrice: 3500,
        pricePerKm: 1000,
        image: "ride2.webp",
        isActive: true,
      },
      {
        id: "business",
        name: "Business",
        subtitle: "Premium cars, top drivers",
        seats: 4,
        basePrice: 2000,
        pricePerKm: 800,
        image: "car3.png",
        isActive: true,
      },
      {
        id: "bike",
        name: "Express Bike",
        subtitle: "Fast delivery & solo rides",
        seats: 1,
        basePrice: 1000,
        pricePerKm: 500,
        image: "bike.png",
        isActive: true,
      },
    ];

    await RideType.insertMany(rideTypes);

    res.json({
      message: "Ride types seeded successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Seed error" });
  }
};


export const seedWalletHistory = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const now = Date.now();

    const transactions = [
      {
        user: userId,
        title: "Added To Wallet",
        amount: 10000,
        type: "credit",
        status: "success",
        method: "Paystack",
        reference: "PSK-29384756",
        createdAt: new Date(now - 1 * 3600 * 1000),
      },
      {
        user: userId,
        title: "Ride Payment",
        amount: 3500,
        type: "debit",
        status: "success",
        method: "Wallet",
        reference: "RIDE-001",
        createdAt: new Date(now - 1 * 3600 * 1000),
      },
      {
        user: userId,
        title: "Added To Wallet",
        amount: 5000,
        type: "credit",
        status: "success",
        method: "Paystack",
        reference: "PSK-83920123",
        createdAt: new Date(now - 1 * 3600 * 1000),
      },
      {
        user: userId,
        title: "Ride Payment",
        amount: 2000,
        type: "debit",
        status: "success",
        method: "Wallet",
        reference: "RIDE-002",
        createdAt: new Date(now - 1 * 3600 * 1000),
      },
      {
        user: userId,
        title: "Wallet Funding",
        amount: 8000,
        type: "credit",
        status: "pending",
        method: "Paystack",
        reference: "PSK-00000000",
        createdAt: new Date(now - 1 * 3600 * 1000),
      },
    ];

    await WalletTransaction.insertMany(transactions);

    res.json({
      message: "Wallet transactions seeded successfully",
      count: transactions.length,
    });
  } catch (error) {
    console.log("seed error:", error);
    res.status(500).json({ message: "Server error" });
  }
};