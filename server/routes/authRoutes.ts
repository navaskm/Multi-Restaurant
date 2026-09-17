import { Router } from "express";
import { getUserProfile, loginUser, registerUser } from "../controllers/authControllers.js";
import { protect } from "../middleware/auth.js";

const authRouter = Router();

authRouter.post('/register', registerUser);
authRouter.post('/login', loginUser);
authRouter.get('/me', protect, getUserProfile);

export default authRouter;