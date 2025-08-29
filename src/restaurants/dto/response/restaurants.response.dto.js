// restaurants.response.dto.js

// 개별 레스토랑 아이템 매핑 (id 포함)
const toRestaurantItem = (r) => ({
  id: r.id,
  name: r.name,
  category: r.category,
  address: r.address,
  telephone: r.telephone,
  mapx: r.mapx,
  mapy: r.mapy,
  isSponsored: r.isSponsored,
});

// 목록 응답 DTO
export const fetchRestaurantsResponseDto = (data) => {
  const restaurants = Array.isArray(data?.restaurants) ? data.restaurants : [];
  const counts = Number.isFinite(data?.counts) ? data.counts : 0;

  return {
    lists: restaurants.map(toRestaurantItem),
    counts,
  };
};
