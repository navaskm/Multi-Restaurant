import "dotenv/config";
import express, { NextFunction, Request, Response } from 'express';
import cors from "cors";
import connectDB from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import restaurantRoute from "./routes/restaurantRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";

const app = express();
await connectDB();

// Middleware
app.use(cors())
app.use(express.json());

const port = process.env.PORT || 4000;

// Routes
app.get('/', (req: Request, res: Response) => {
  res.send('Server is Live!');
});
app.use('/api/auth', authRouter);
app.use('/api/restaurants', restaurantRoute);
app.use('/api/bookings', bookingRouter);

// GLOBAL ERROR HANDLER
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message || 'Something went wrong!',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});