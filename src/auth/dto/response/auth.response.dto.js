export const loginResponseDto = (data) => {
  return {
    tokens: data.tokens,
    user: data.payload,
  };
};
export const logoutResponseDto = (data) => {};
