import type { GameConfig } from "./configTypes";

export function getOrderedTopics(config: GameConfig) {
  return [...config.topics].sort((a, b) => a.order - b.order);
}
