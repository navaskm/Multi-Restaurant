import { Request, Response } from 'express';
import {User} from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { AuthenticatedRequest } from '../middleware/auth.js';


// Generate JWT token
const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: '30h' });
};


// Register a new user
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role } = req.body;

    if(!name || !email || !password) {
      res.status(400).json({ message: 'Please enter all required fields' });
      return;
    }

    // check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    };

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({ name, email, password: hashedPassword, phone, role });

    if(user){
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id.toString())
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    };

  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};


// Login a user
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if(!email || !password) {
      res.status(400).json({ message: 'Please provide email and password' });
      return;
    };

    // check for user email
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: 'Invalid email or password' });
      return;
    };

    // // check for user password
    const isMatch = await bcrypt.compare(password, user.password as string);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    };

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id.toString())
    });

  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};


// get user profile
export const getUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    
    if(!req.user) {
      res.status(401).json({ message: 'Not authorized, no user found' });
      return;
    }

    res.status(200).json(req.user);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};