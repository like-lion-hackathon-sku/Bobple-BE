export const fetchRestaurantsResponseDto = (data) => {
  return {
    lists: data.restaurants,
    counts: data.counts,
  };
};
export const fetchRestaurantDetailResponseDto = (data) => {
  return {
    name: data.name,
    category: data.category,
    address: data.address,
    telephone: data.telephone,
    mapx: data.mapx,
    mapy: data.mapy,
    isSponsored: data.isSponsored,
  };
};
