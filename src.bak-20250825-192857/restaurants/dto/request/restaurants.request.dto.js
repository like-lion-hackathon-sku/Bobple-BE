export const fetchRestaurantsRequestDto = (query) => {
  return {
    sponsoredOnly: query.sponsoredOnly === "1",
    page: parseInt(query.page) || 1,
    take: parseInt(query.take) || 5,
  };
};
