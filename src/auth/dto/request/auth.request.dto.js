export const loginRequestDto = (body) => {
  return {
    idToken: body.idToken,
  };
};
export const logoutRequestDto = (cookies) => {
  return {
    refreshToken: cookies.refreshToken,
  };
};
