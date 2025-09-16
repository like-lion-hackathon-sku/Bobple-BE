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
export const refreshRequestDto = (cookies) => {
  return {
    refreshToken: cookies.refreshToken,
  };
};
export const updateProfileRequestDto = (body, file, payload) => {
  return {
    id: payload.id,
    nickname: body.nickname,
    grade: parseInt(body.grade),
    gender: body.gender,
    profileImage: file,
  };
};
