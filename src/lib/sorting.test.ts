import { describe, expect, it } from "vitest";
import { sortRewards } from "./sorting";

describe("sortRewards", () => {
  it("sorts by value, then name, then id", () => {
    const rewards = [
      { id: "c", name: "Same", description: "", coinValue: 40 as const, type: "SELLABLE" as const },
      { id: "b", name: "Same", description: "", coinValue: 40 as const, type: "SELLABLE" as const },
      { id: "d", name: "Alpha", description: "", coinValue: 50 as const, type: "SELLABLE" as const },
      { id: "a", name: "Alpha", description: "", coinValue: 40 as const, type: "SELLABLE" as const },
    ];
    expect([...rewards].sort(sortRewards).map((reward) => reward.id)).toEqual(["a", "b", "c", "d"]);
  });
});
