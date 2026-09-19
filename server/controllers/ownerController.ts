import { Response } from "express"
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Restaurant } from "../models/Restaurant.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import { Booking } from "../models/Booking.js";


// Get owner's restaurant
export const getOwnerRestaurant = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurants = await Restaurant.findOne({owner: req.user?._id});

    if(!restaurants){
      res.status(200).json(null);
      return;
    };

    res.status(200).json(restaurants);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};



// Create owner's restaurant (submitted to pending)
export const createOwnerRestaurant = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const existing = await Restaurant.findOne({owner: req.user?._id});

    if(existing){
      res.status(400).json({message: "You already have a restaurant registered"});
      return;
    }

    const {name, description, cuisine, priceRange, location, address, chef, tags, availableSlots, totalSeats} = req.body;

    if(!name || !description || !cuisine || !priceRange || !location || !address || !chef){
      res.status(400).json({message: "Please provide all required fields"});
      return
    };

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
    const slugExists = await Restaurant.findOne({slug});

    if(slugExists){
      res.status(400).json({message: "A restaurant with this name already exists"});
      return;
    };

    // Handle image
    let imgUrl = '';

    if(req.file){
      imgUrl = (await uploadToCloudinary(req.file.buffer)).secure_url;
    }

    // Setup parsed tags and slots
    const parsedTags = typeof tags === 'string'
      ? tags.split(',').map(t => t.trim())
      : tags || [];

    const parsedSlots = typeof availableSlots === 'string'
      ? availableSlots.split(',').map(s => s.trim())
      : availableSlots || ["17:00", "18:00", "19:00", "20:00", "21:00"];

    const restaurant = await Restaurant.create({
      name,
      slug,
      description,
      cuisine,
      priceRange,
      location,
      address,
      chef,
      image: imgUrl,
      tags: parsedTags,
      availableSlots: parsedSlots,
      totalSeats: totalSeats ? Number(totalSeats) : 20,
      owner: req.user?._id,
      status: "pending"
    });

    res.status(201).json(restaurant);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};



// Update owner's restaurant
export const updateOwnerRestaurant = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurant = await Restaurant.findOne({owner: req.user?._id});

    if(!restaurant){
      res.status(404).json({message: "Restaurant profile not found"});
      return;
    }

    const {name, description, cuisine, priceRange, location, address, chef, tags, availableSlots, totalSeats} = req.body;

    if(name) restaurant.name = name;
    if(description) restaurant.description = description;
    if(cuisine) restaurant.cuisine = cuisine;
    if(priceRange) restaurant.priceRange = priceRange;
    if(location) restaurant.location = location;
    if(address) restaurant.address = address;
    if(chef) restaurant.chef = chef;
    if(totalSeats) restaurant.totalSeats = totalSeats;

    if(tags){
      restaurant.tags = typeof tags === 'string'
        ? tags.split(',').map(t => t.trim())
        : tags;
    };

    if(availableSlots){
      restaurant.availableSlots = typeof availableSlots === 'string'
        ? availableSlots.split(',').map(s => s.trim())
        : availableSlots;
    };

    // Handle new image upload
    if(req.file){
      restaurant.image = (await uploadToCloudinary(req.file.buffer)).secure_url;
    };

    const updated = await restaurant.save();
    res.json(200).json(updated);

  } catch (error: any) {
    res.status(400).json({ message: error.message });
  };
};



// Get booking for owner's restaurant
export const getOwnerBookings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurant = await Restaurant.findOne({owner: req.user?._id});

    if(!restaurant){
      res.status(404).json({message: "Restaurant profile not found"});
      return;
    };

    const booking = await Booking.find({restaurant: restaurant._id})
      .populate("user", "name email phone")
      .sort({date: -1, time: -1});

    res.status(200).json(booking)
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};



// Update status of a booking
export const updateBookingStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {status} = req.body;

    if(!status || !["confirmed", "cancelled", "completed"].includes(status)){
      res.status(400).json({message: "Please enter a valid booking status"});
      return;
    };

    const booking = await Booking.findById(req.params.id);

    if(!booking){
      res.status(404).json({message: "Booking not found"});
      return;
    };

    // Verify booking belongs to the owner's restaurant
    const restaurant = await Restaurant.findById(booking.restaurant);

    if(!restaurant || restaurant.owner.toString() !== req.user?._id.toString()){
      res.status(401).json({message: "Not authorized to manage this booking"});
      return;
    };

    booking.status = status;
    await booking.save();
    res.status(200).json(booking)

  } catch (error: any) {
    res.status(400).json({ message: error.message });
  };
};