export const fetchRestaurantsResponseDto = (data) => {
  return {
    lists: data.restaurants,
    counts: data.counts,
  };
};
