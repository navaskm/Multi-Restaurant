import { NextFunction, Request, Response } from 'express';
import { IUser, User } from '../models/User.js';
import jwt from 'jsonwebtoken';


export interface AuthenticatedRequest extends Request {
  user?: IUser;
}


export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {

  let token;

  if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // get token from header
      token = req.headers.authorization.split(' ')[1];

      // verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {id: string};

      // get user from the token. exclude password field
      const user = await User.findById(decoded.id).select('-password');

      if(!user) {
        res.status(401).json({ message: 'Not authorized, user not found' });
        return;
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
      return;
    }
  }

  if(!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
    return;
  }
};


// Middleware to restrict access to admin users only
export const adminOnly = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if(req.user?.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized, admin only' });
  }
};


// Middleware to restrict access to owner users only
export const ownerOnly = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if(req.user?.role === 'owner' || req.user?.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized, owner only' });
  }
};
