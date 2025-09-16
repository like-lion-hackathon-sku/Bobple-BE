import { NotFoundRestaurantError } from "../../error.js";
import {
  fetchRestaurantDetailResponseDto,
  fetchRestaurantsResponseDto,
} from "../dto/response/restaurants.response.dto.js";
import {
  countRestaurants,
  findRestaurantById,
  findRestaurants,
} from "../repository/restaurants.repository.js";

export const fetchRestaurants = async (data) => {
  data.options = undefined;
  if (data.sponsoredOnly) {
    data.options = {
      isSponsored: true,
    };
  }
  const restaurants = await findRestaurants(data);
  const counts = {
    isSponsored: await countRestaurants({
      isSponsored: true,
    }),
    isNotSponsored: await countRestaurants({
      isSponsored: false,
    }),
  };
  return fetchRestaurantsResponseDto({ restaurants, counts });
};
export const fetchRestaurantDetail = async (data) => {
  const restaurant = await findRestaurantById(data);
  if (!restaurant) {
    throw new NotFoundRestaurantError("찾을 수 없는 식당 입니다.", data);
  }
  return fetchRestaurantDetailResponseDto(restaurant);
};
