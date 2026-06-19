export function getCorrectStreakBonus(correctStreakCount: number) {
  return Math.ceil(correctStreakCount / 5) * 5;
}
