export const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProd = process.env.SERVER_ENV === "production"; // 또는 NODE_ENV
  const base = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/", // ★ 중요: 전체 경로에서 쿠키 전송
  };

  if (accessToken) {
    res.cookie("accessToken", accessToken, {
      ...base,
      maxAge: 1000 * 60 * 10,
    });
  }
  if (refreshToken) {
    res.cookie("refreshToken", refreshToken, {
      ...base,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
  }
};

export const clearTokenCookies = (res) => {
  const isProd = process.env.SERVER_ENV === "production";
  const base = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/", // ★ set 할 때와 동일해야 정확히 삭제됨
  };
  res.clearCookie("accessToken", base);
  res.clearCookie("refreshToken", base);
};
