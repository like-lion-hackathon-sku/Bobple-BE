import express from "express";
import {
  handleFetchRestaurants,
  handlefetchRestautantDetails,
} from "../controller/restaurants.controller.js";

const router = express.Router({ mergeParams: true });
router.get("/", handleFetchRestaurants);
router.get("/:restaurantId", handlefetchRestautantDetails);
export default router;
