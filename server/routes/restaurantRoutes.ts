import { Router } from "express";
import { getAllRestaurants, getFeaturedRestaurants, getRestaurantAvailability, getRestaurantsBySlug } from "../controllers/restaurantController.js";

const restaurantRoute = Router();

restaurantRoute.get('/', getAllRestaurants);
restaurantRoute.get('/featured', getFeaturedRestaurants);
restaurantRoute.get('/:slug', getRestaurantsBySlug);
restaurantRoute.get('/:id/availability', getRestaurantAvailability);

export default restaurantRoute;