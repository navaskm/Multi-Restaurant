import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Restaurant } from "../models/Restaurant.js";
import { User } from "../models/User.js";
import { Booking } from "../models/Booking.js";


// Get all restaurant for admin management
export const getAllRestaurants = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurants = await Restaurant.find({})
      .populate("owner", "name email phone")
      .sort({ createdAt: -1});
    
    res.status(200).json(restaurants);
  } catch (error: any) {
    res.status(400).json({message: error.message})
  }
};



// Approve/reject a restaurant
export const approveRestaurants = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {status} = req.body;

    if(!status || !['pending', 'approved', 'rejected'].includes(status)){
      res.status(400).json({message: 'Please provide a valid approval status'});
      return;
    };

    const restaurant = await Restaurant.findById(req.params.id);

    if(!restaurant){
      res.status(400).json({message: 'Restaurant profile not found'});
      return;
    };

    restaurant.status = status;
    await restaurant.save();

    res.status(200).json(restaurant);
  } catch (error: any) {
    res.status(400).json({message: error.message})
  }
};



// Get system statistics
export const getAdminStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalOwners = await User.countDocuments({ role: "owner" });
    const totalBookings = await Booking.countDocuments({});
    const totalRestaurants = await Restaurant.countDocuments({});

    // Get latest 10 bookings
    const latestBookings = await Booking.find({})
      .populate("user", "name email")
      .populate("restaurant", "name")
      .sort({ createdAt: -1})
      .limit(10);

    res.status(200).json({
      users: {
        totalUsers,
        totalOwners,
        total: totalUsers + totalOwners,
      },

      totalRestaurants,
      totalBookings,
      latestBookings
    });

  } catch (error: any) {
    res.status(400).json({message: error.message})
  }
}