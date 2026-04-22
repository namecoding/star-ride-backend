import RideType from "../models/RideType.js";

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