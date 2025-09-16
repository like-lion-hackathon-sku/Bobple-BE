export function parseCreateBody(body = {}) {
  const {
    title,
    content,
    restaurantId,   // camelCase로 받음
    startAt,
    endAt,
    maxParticipants, // camelCase로 받음
  } = body;

  if (!title || !restaurantId || !startAt || !endAt) {
    throw new Error('제대로 입력하세요');
  }

  const start = new Date(startAt);
  const end   = new Date(endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('잘못된 시간입니다.');
  }
  if (start <= new Date()) {
    throw new Error('시작 시간은 현재보다 미래에 가능합니다');
  }
  if (end <= start) {
    throw new Error('종료 시간은 시작 시간보다 미래에 가능합니다. ');
  }

  let maxP = maxParticipants ?? 4;
  maxP = Number(maxP);
  if (!Number.isFinite(maxP) || maxP < 1 || maxP > 4) {
    throw new Error('최대 참여 인원은 1~4명입니다.');
  }

  return {
    title,
    content: content ?? '',
    restaurantId: Number(restaurantId),
    startAt: start,
    endAt: end,
    maxParticipants: maxP,
  };
}