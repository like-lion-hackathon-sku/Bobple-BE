import { fetchRestaurantsResponseDto } from "../dto/response/restaurants.response.dto.js";
import {
  countRestaurants,
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
