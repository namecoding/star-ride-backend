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
        price: 4500,
        image: "ride.png",
        isActive: true,
      },
      {
        id: "premium",
        name: "Premium",
        subtitle: "More space, smoother ride",
        seats: 4,
        price: 5000,
        image: "ride2.webp",
        isActive: true,
      },
      {
        id: "business",
        name: "Business",
        subtitle: "Premium cars, top drivers",
        seats: 4,
        price: 6500,
        image: "car3.png",
        isActive: true,
      },
      {
        id: "bike",
        name: "Express Bike",
        subtitle: "Fast delivery & solo rides",
        seats: 1,
        price: 3500,
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