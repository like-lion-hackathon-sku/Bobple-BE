/** DB -> API (공개) */
export const mapUserPublic = (u) => {
  if (!u) return null;
  return {
    id: u.id,
    nickname: u.nickname ?? null,
    grade: u.grade ?? null,
    gender: u.gender ?? null,          // "M" | "F" | "N" | null
    profileImg: u.profileImg ?? null,
    createdAt: u.createdAt,
  };
};

/** DB -> API (개인/관리자) */
export const mapUserPrivate = (u) => {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    uid: u.uid,
    nickname: u.nickname ?? null,
    grade: u.grade ?? null,
    gender: u.gender ?? null,
    profileImg: u.profileImg ?? null,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt ?? null,
    isCompleted: u.isCompleted,
  };
};
