import express from "express";
import { handleFetchRestaurants } from "../controller/restaurants.controller.js";

const router = express.Router({ mergeParams: true });
router.get("/", handleFetchRestaurants);
export default router;
