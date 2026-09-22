import { Router } from "express";
import { approveRestaurants, getAdminStatus, getAllRestaurants } from "../controllers/adminControllers.js";
import { adminOnly, protect } from "../middleware/auth.js";

const adminRouter = Router();

adminRouter.use(protect);
adminRouter.use(adminOnly);

adminRouter.get('/restaurants', getAllRestaurants);
adminRouter.put('/restaurants/:id/approve', approveRestaurants);
adminRouter.get('/stats', getAdminStatus);

export default adminRouter;