export function getRandomIndex(length: number): number {
  return Math.floor(Math.random() * length);
}

export function getSegmentAngle(rewardCount: number) {
  return 360 / rewardCount;
}

export function getSegmentCenterAngle(selectedIndex: number, rewardCount: number) {
  const segmentAngle = getSegmentAngle(rewardCount);
  return selectedIndex * segmentAngle + segmentAngle / 2;
}

function normalizeRotationDeg(degrees: number) {
  return ((degrees % 360) + 360) % 360;
}

export function getTargetRotationDeg(
  currentRotationDeg: number,
  selectedIndex: number,
  rewardCount: number,
) {
  const segmentCenterAngle = getSegmentCenterAngle(selectedIndex, rewardCount);
  const currentRotationWithinCircle = normalizeRotationDeg(currentRotationDeg);
  const selectedSegmentTargetRotation = normalizeRotationDeg(360 - segmentCenterAngle);
  const rotationDelta = normalizeRotationDeg(selectedSegmentTargetRotation - currentRotationWithinCircle);

  return currentRotationDeg + 360 * 6 + rotationDelta;
}
