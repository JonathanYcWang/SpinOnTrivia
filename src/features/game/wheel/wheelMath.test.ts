import { describe, expect, it, vi } from "vitest";
import { getRandomIndex, getSegmentAngle, getTargetRotationDeg } from "./wheelMath";

describe("wheel math", () => {
  it("uses equal segment sizes", () => {
    expect(getSegmentAngle(4)).toBe(90);
    expect(getSegmentAngle(1)).toBe(360);
  });

  it("maps selected index to target rotation", () => {
    expect(getTargetRotationDeg(0, 0, 4)).toBe(360 * 6 + 315);
  });

  it("compensates for existing wheel rotation on later spins", () => {
    const target = getTargetRotationDeg(90, 0, 4);
    expect(target % 360).toBe(315);
  });

  it("keeps the final rotation aligned to the selected segment center", () => {
    const selectedIndex = 2;
    const rewardCount = 5;
    const target = getTargetRotationDeg(2875, selectedIndex, rewardCount);
    const selectedCenter = 180;
    expect((target + selectedCenter) % 360).toBe(0);
  });

  it("one remaining reward has index 0", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    expect(getRandomIndex(1)).toBe(0);
  });
});
