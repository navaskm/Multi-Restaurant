import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Restaurant } from "../models/Restaurant.js";
import { Booking } from "../models/Booking.js";


// Create a new booking
export const createBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { restaurantId, date, time, guests, occasion, specialRequests } = req.body;

    if(!restaurantId || !date || !time || !guests){
      res.status(400).json({ message: 'Please provide all required reservation details' });
      return;
    }

    // Check if Restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);

    if(!restaurant){
      res.status(404).json({message: 'Restaurant not found'});
      return;
    };

    // Verify restaurant is approved
    if(restaurant.status !== 'approved'){
      res.status(400).json({message: 'Reservation are not open for this restaurant yet'});
      return;
    };

    // Verify seat availability
    const existingBooking = await Booking.find({
      restaurant: restaurantId,
      date: new Date(date),
      time,
      status: 'confirmed'
    });

    const bookedSeats = existingBooking.reduce((sum, b) => sum + b.guests, 0);
    const totalSeats = restaurant.totalSeats || 20;
    const availableSeats = totalSeats - bookedSeats;

    if(Number(guests) > availableSeats){
      res.status(400).json({
        message: `Unable to reserve. Only ${availableSeats} seats are available for this time slot.`
      })
    };

    const booking = await Booking.create({
      user: req.user?._id,
      restaurant: restaurantId,
      date: new Date(date),
      time,
      guests: Number(guests),
      occasion,
      specialRequests,
      status: 'confirmed'
    });

    // Popular restaurant info
    const populatedBooking = await booking.populate('restaurant', 'name location image address');

    res.status(201).json(populatedBooking)
    
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}



// get logged in user booking
export const getMyBookings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const booking = await Booking.find({user: req.user?._id})
      .populate("restaurant", "name location image address slug")
      .sort({date: -1, time: -1});

    res.status(200).json(booking)
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}



// Cancel a booking
export const cancelBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id);

    if(!booking){
      res.status(404).json({ message: 'Booking not found' });
      return;
    };

    // Verify user owns the booking
    if(booking.user.toString() !== req.user?._id.toString()){
      res.status(401).json({ message: 'Not authorized to cancel this booking' });
      return;
    };

    booking.status = "cancelled";
    await booking.save();

    const populatedBooking = await booking.populate('restaurant', 'name location image address');

    res.status(200).json(populatedBooking);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}