export const loginResponseDto = (data) => {
  return {
    tokens: data.tokens,
    user: data.payload,
  };
};
export const logoutResponseDto = (data) => {};
export const refreshResponseDto = (data) => {
  return {
    accessToken: data.accessToken,
    user: data.newPayload,
  };
};
export const updateProfileResponseDto = (data) => {
  return {
    id: data.id,
    email: data.email,
    nickname: data.nickname,
    grade: data.grade,
    gender: data.gender,
    profileImage: data.profileImg,
    isCompleted: data.isCompleted,
  };
};
