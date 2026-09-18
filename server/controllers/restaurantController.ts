import { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { Restaurant } from "../models/Restaurant.js";
import { User } from "../models/User.js";
import { Booking } from "../models/Booking.js";


// Get all restaurants with search and filters
export const getAllRestaurants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, priceRange, rating, location, sort } = req.query;

    // Build query object
    const queryObj: any = {status: 'approved'};

    if(search){
      queryObj.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    };

    if(priceRange){
      const price = Array.isArray(priceRange) ? priceRange : [priceRange];
      queryObj.priceRange = { $in: price };
    };

    if(rating){
      queryObj.rating = { $gte: parseFloat(rating as string) };
    };

    if(location){
      queryObj.location = { $regex: location as string, $options: 'i' };
    }

    // Build sort object
    let sortOption: any = {createdAt: -1}; // Default sort by createdAt descending

    if (sort) {
      if (sort === 'rating') {
        sortOption = { rating: -1 }; // Sort by rating descending
      } else if (sort === 'price_low'){
        sortOption = { priceRange: 1 }; // Sort by price ascending
      } else if (sort === 'price_high'){
        sortOption = { priceRange: -1 }; // Sort by price descending
      }
    };

    const restaurants = await Restaurant.find(queryObj).sort(sortOption);

    res.status(200).json(restaurants);

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  };
};



// Get all featured and exclusive restaurants
export const getFeaturedRestaurants = async (req: Request, res: Response): Promise<void> => {
  try {

    const featuredRestaurants = await Restaurant.find({
      status: 'approved',
      $or: [{ featured: true }, { exclusive: true }]
    }).limit(6);

    res.status(200).json(featuredRestaurants);

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}



// Get single restaurant by slug
export const getRestaurantsBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurant = await Restaurant.findOne({ slug: req.params.slug });

    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    };

    // if not approved, verify authorization (owner or admin)
    if(restaurant.status !== 'approved'){
      let isAuthorized = false;

      if(req.headers.authorization?.startsWith('Bearer')){
        try {

          const token = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string, role: string };
          const user = await User.findById(decoded.id);

          if(user?.role === 'admin' || (user?.role === 'owner' && restaurant.owner.toString() === user?._id.toString())){
            isAuthorized = true;
          }

        } catch (error) {
          res.status(401).json({ message: 'Invalid token' });
          return;
        }
      }

      if(!isAuthorized){
        res.status(404).json({ message: 'Restaurant not found or pending approval' });
        return;
      }
    }

    res.status(200).json(restaurant);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}



// Get dynamic seat availability for slots
export const getRestaurantAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.query;

    if (!date) {
      res.status(400).json({ message: 'Please provide a data' });
      return;
    };

    const restaurant = await Restaurant.findById(req.params.id)

    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    };
    
    const bookingData = new Date(date as string);

    // Get all active booking on this date for the restaurant
    const bookings = await Booking.find({
      restaurant: restaurant._id,
      date: bookingData,
      status: 'confirmed'
    });

    // Map slots to available capacities
    const availability = restaurant.availableSlots.map(slot => {

      const bookedSeats = bookings.filter(b => b.time === slot).reduce((sum, b) => sum + b.guests, 0);
      const totalSeats = restaurant.totalSeats || 20;
      const availableSeats = Math.max(0, totalSeats - bookedSeats);

      return {
        time: slot,
        availableSeats,
        isAvailable: availableSeats > 0
      };
    });

    res.json(availability);

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}