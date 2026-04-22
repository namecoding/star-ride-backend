import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  // Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // attach user to request
      req.user = await User.findById(decoded.id).select("_id role isDeleted");

      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (req.user.isDeleted) {
        return res.status(403).json({ message: "Account deactivated" });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
};