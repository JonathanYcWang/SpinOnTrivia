# Senior Engineer Implementation Plan: Jeopardy Coin Board + Reward Wheel Game

## 0. Implementation Position

Build this as a frontend-only V1 using:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- localStorage for admin configuration persistence
- In-memory React state for gameplay only

There are no blocking product questions from the PRD. Do not add product behavior beyond the PRD.

The implementation should prioritize:

1. Correct gameplay rules.
2. Deterministic, testable domain logic.
3. Clean separation between configuration persistence and runtime gameplay state.
4. Mobile-first UI.
5. Accessibility basics.
6. Future replaceability of localStorage with JSON file or API storage.

---

## 1. Non-Negotiable Product Rules

The agent must preserve these exactly:

- Gameplay progress is never persisted.
- Admin configuration is persisted in localStorage.
- localStorage key is `jeopardy-wheel-config`.
- Game starts only if there is at least 1 valid reward and at least 1 valid question.
- Player starts each game with `0` coins.
- Currency display is visually `🪙 5`, not `5 Coins`.
- Spin always costs `🪙 5`.
- Wheel odds are equal across remaining rewards.
- Reward value does not affect wheel probability.
- Reward acquisition removes the reward from both wheel and Buy tab.
- A reward can only be acquired once.
- Sold rewards are permanently removed.
- Duplicate reward names are allowed.
- Duplicate question slots are not allowed.
- Question uniqueness is `topicId + coinValue`.
- Question modal is non-dismissible.
- Completed questions cannot be reopened.
- Wheel empty means immediate game over, even if coins or owned rewards remain.
- No meaningful actions remaining also means game over.
- Admin has no authentication.
- No backend, database, import button, reward images, markdown, rich text, AI grading, speech recognition, score ranking, leaderboard, or persisted gameplay sessions.

---

## 2. Project Setup

### 2.1 Create App

Use a new Next.js app with TypeScript, App Router, Tailwind, ESLint, and `src` directory.

```bash
npm create next-app@latest jeopardy-wheel-game -- \
  --ts \
  --eslint \
  --app \
  --src-dir \
  --tailwind \
  --import-alias "@/*"
```

Use `npm` as the project package manager. Commit the generated `package-lock.json` and do not add `pnpm-lock.yaml`, `yarn.lock`, or Corepack configuration.

### 2.2 Recommended Dev Dependencies

Install testing tools:

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event playwright @playwright/test
```

No UI component library is required for V1. Use custom components with semantic HTML and Tailwind.

Do not add Redux, Zustand, XState, Framer Motion, Radix, shadcn/ui, or backend libraries unless explicitly requested later.

### 2.3 Required Scripts

Add or confirm these scripts in `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test",
    "verify": "npm run typecheck && npm run lint && npm run test && npm run build"
  }
}
```

---

## 3. Target Folder Structure

Use this structure:

```text
src/
  app/
    layout.tsx
    page.tsx
    admin/
      page.tsx
    game/
      page.tsx
    globals.css

  components/
    ui/
      Button.tsx
      Card.tsx
      CoinDisplay.tsx
      ConfirmDialog.tsx
      Field.tsx
      FieldError.tsx
      Input.tsx
      Select.tsx
      Tabs.tsx
      ToastProvider.tsx
      VisuallyHidden.tsx

  features/
    config/
      admin/
        AdminPageClient.tsx
        TopicsEditor.tsx
        QuestionsEditor.tsx
        RewardsEditor.tsx
        AdminUnsavedChangesGuard.tsx
      defaultConfig.ts
      configRepository.ts
      localStorageConfigRepository.ts
      configTypes.ts
      configValidation.ts
      configSelectors.ts

    game/
      GamePageClient.tsx
      GameProvider.tsx
      gameTypes.ts
      gameReducer.ts
      gameActions.ts
      gameSelectors.ts
      gameInitialization.ts
      gameValidation.ts
      gameplayLeaveGuard.ts
      board/
        BoardTab.tsx
        BoardGrid.tsx
        BoardCell.tsx
        QuestionModal.tsx
      wheel/
        WheelTab.tsx
        RewardWheel.tsx
        wheelMath.ts
      shop/
        ShopTab.tsx
        BuyTab.tsx
        SellTab.tsx
        RewardCard.tsx
        SellRewardDialog.tsx

    home/
      HomePageClient.tsx

  lib/
    assertNever.ts
    ids.ts
    json.ts
    sorting.ts
    storage.ts
    timers.ts

  test/
    fixtures/
      configs.ts
      gameStates.ts
    setup.ts
```

---

## 4. Routing Plan

### 4.1 Routes

Use three routes:

```text
/       Home
/admin  Admin
/game   Active gameplay
```

### 4.2 Home Route

`src/app/page.tsx`

Server component that renders:

```tsx
<HomePageClient />
```

The Home screen contains only:

```text
[Start Game]
[Admin]
```

Do not show config summaries, counts, history, or gameplay state.

### 4.3 Admin Route

`src/app/admin/page.tsx`

Server component that renders:

```tsx
<AdminPageClient />
```

The Admin page is a single-page inline editor with sections:

```text
Admin
Topics
Questions
Rewards
Save Configuration
```

No admin tabs, auth, passwords, separate edit pages, or edit modals.

### 4.4 Game Route

`src/app/game/page.tsx`

Server component that renders:

```tsx
<GamePageClient />
```

`GamePageClient` loads the saved/default configuration client-side, validates startup requirements, initializes a new in-memory game, and selects the Board tab by default.

If config is invalid, show validation errors and do not initialize gameplay.

---

## 5. TypeScript Domain Model

### 5.1 Shared Primitive Types

Create `src/features/config/configTypes.ts`.

```ts
export const QUESTION_COIN_VALUES = [5, 10, 15, 20] as const;
export type QuestionCoinValue = (typeof QUESTION_COIN_VALUES)[number];

export const REWARD_COIN_VALUES = [20, 25, 30, 35, 40, 45, 50] as const;
export type RewardCoinValue = (typeof REWARD_COIN_VALUES)[number];

export type EntityId = string;
```

### 5.2 Config Types

```ts
export type GameConfigVersion = 1;

export type TopicConfig = {
  id: EntityId;
  name: string;
  order: number;
};

export type QuestionConfig = {
  id: EntityId;
  topicId: EntityId;
  coinValue: QuestionCoinValue;
  questionText: string;
  answerText: string;
};

export type RewardConfig = {
  id: EntityId;
  name: string;
  description: string;
  coinValue: RewardCoinValue;
};

export type GameConfig = {
  version: GameConfigVersion;
  topics: TopicConfig[];
  questions: QuestionConfig[];
  rewards: RewardConfig[];
};
```

### 5.3 Admin Draft Types

Use draft types so new rows can be incomplete before save.

```ts
export type DraftQuestionCoinValue = QuestionCoinValue | "";
export type DraftRewardCoinValue = RewardCoinValue | "";

export type DraftTopic = {
  id: EntityId;
  name: string;
  order: number;
};

export type DraftQuestion = {
  id: EntityId;
  topicId: EntityId | "";
  coinValue: DraftQuestionCoinValue;
  questionText: string;
  answerText: string;
};

export type DraftReward = {
  id: EntityId;
  name: string;
  description: string;
  coinValue: DraftRewardCoinValue;
};

export type DraftGameConfig = {
  version: 1;
  topics: DraftTopic[];
  questions: DraftQuestion[];
  rewards: DraftReward[];
};
```

This avoids guessing default values when the admin clicks Add.

---

## 6. Default Configuration

Create `src/features/config/defaultConfig.ts`.

Use:

```ts
export const DEFAULT_CONFIG: GameConfig = {
  version: 1,
  topics: [],
  questions: [],
  rewards: [
    {
      id: "reward-mahas-po-boy",
      name: "Maha’s Po Boy",
      description: "",
      coinValue: 40,
    },
    {
      id: "reward-molly-tea",
      name: "Molly Tea",
      description: "",
      coinValue: 20,
    },
    {
      id: "reward-macs-pizza-slice",
      name: "Mac’s Pizza Slice",
      description: "",
      coinValue: 20,
    },
    {
      id: "reward-badialli-slice",
      name: "Badialli Slice",
      description: "",
      coinValue: 20,
    },
    {
      id: "reward-fresca-slice",
      name: "Fresca Slice",
      description: "",
      coinValue: 20,
    },
    {
      id: "reward-maker-slice",
      name: "Maker Slice",
      description: "",
      coinValue: 20,
    },
    {
      id: "reward-tokyo-toast",
      name: "Tokyo Toast",
      description: "",
      coinValue: 30,
    },
    {
      id: "reward-favourites-oysters",
      name: "Favourites Oysters",
      description: "",
      coinValue: 40,
    },
    { id: "reward-alfies", name: "Alfie’s", description: "", coinValue: 50 },
    {
      id: "reward-good-brother-skewers-2x",
      name: "Good Brother Skewers 2x",
      description: "",
      coinValue: 30,
    },
    { id: "reward-chayan", name: "Chayan", description: "", coinValue: 20 },
    { id: "reward-hey-tea", name: "Hey Tea", description: "", coinValue: 20 },
    {
      id: "reward-la-la-pork-floss-bun",
      name: "La La Pork Floss Bun",
      description: "",
      coinValue: 20,
    },
    {
      id: "reward-terroni-sud-forno-pasta",
      name: "Terroni Sud Forno Pasta",
      description: "",
      coinValue: 40,
    },
    {
      id: "reward-bang-bang-ice-cream",
      name: "Bang Bang Ice Cream",
      description: "",
      coinValue: 20,
    },
    {
      id: "reward-patios-pineapple-burger",
      name: "Patio’s Pineapple Burger",
      description: "",
      coinValue: 40,
    },
    {
      id: "reward-hello-nori-set",
      name: "Hello Nori Set",
      description: "",
      coinValue: 45,
    },
    {
      id: "reward-butter-chicken-garlic-naan",
      name: "Butter Chicken + Garlic Naan",
      description: "",
      coinValue: 40,
    },
    {
      id: "reward-daldongnae",
      name: "Daldongnae",
      description: "",
      coinValue: 50,
    },
    {
      id: "reward-bear-steaks",
      name: "Bear Steaks",
      description: "",
      coinValue: 30,
    },
  ],
};
```

Do not add default topics or default questions.

---

## 7. Config Repository Abstraction

Create `src/features/config/configRepository.ts`.

```ts
import type { GameConfig } from "./configTypes";

export type ConfigLoadResult =
  | { status: "loaded"; config: GameConfig }
  | { status: "missing"; config: GameConfig }
  | { status: "malformed"; config: GameConfig; message: string };

export type ConfigSaveResult =
  | { status: "saved" }
  | { status: "failed"; message: string };

export interface ConfigRepository {
  load(): ConfigLoadResult;
  save(config: GameConfig): ConfigSaveResult;
}
```

Create `src/features/config/localStorageConfigRepository.ts`.

Rules:

- Never access localStorage on the server.
- Use `typeof window === "undefined"` guards.
- Use exactly key `jeopardy-wheel-config`.
- If key is missing, return `missing` with `DEFAULT_CONFIG`.
- If JSON parse fails or shape is invalid, return `malformed` with `DEFAULT_CONFIG` and a message.
- Saving overwrites the single key with a JSON string.

Important: malformed saved config should not crash the app. Admin should show the malformed warning while displaying editable default config. Start Game should show an error and block if startup validation fails.

---

## 8. Config Validation

Create `src/features/config/configValidation.ts`.

### 8.1 Validation Result Types

```ts
export type FieldError = {
  entityId: string;
  field: string;
  message: string;
};

export type ConfigValidationResult =
  | { valid: true; config: GameConfig }
  | { valid: false; fieldErrors: FieldError[] };
```

### 8.2 Save Validation Rules

Validate admin saves with these rules:

Topics:

- Topic name is required.
- Trim topic name before saving.
- Topic IDs must be present.

Questions:

- Topic is required.
- Topic must reference an existing topic.
- Coin value is required.
- Coin value must be one of `5 | 10 | 15 | 20`.
- Question text is required.
- Answer text is required.
- Duplicate `topicId + coinValue` is invalid.
- Error message for duplicate slot: `A question already exists for this topic and value.`

Rewards:

- Reward name is required.
- Reward value is required.
- Reward value must be one of `20 | 25 | 30 | 35 | 40 | 45 | 50`.
- Reward description is optional.
- Duplicate reward names are valid.

Do not require at least one question or reward during admin save. That requirement belongs to Start Game validation.

### 8.3 Startup Validation Rules

Create `validateConfigForGameStart(config)`.

Rules:

- At least 1 reward.
- At least 1 question.
- Config must also pass save-level structural validation.

If invalid, Home/Game should show readable validation errors and not start the game.

---

## 9. Sorting Rules

Create `src/lib/sorting.ts`.

```ts
export function sortRewards(a: RewardConfig, b: RewardConfig): number {
  if (a.coinValue !== b.coinValue) return a.coinValue - b.coinValue;
  const nameCompare = a.name.localeCompare(b.name, undefined, {
    sensitivity: "base",
  });
  if (nameCompare !== 0) return nameCompare;
  return a.id.localeCompare(b.id);
}
```

Apply this to:

- Shop Buy tab.
- Shop Sell tab.
- Admin reward list.
- Any reward listing.

Topic sorting:

```ts
topics.sort((a, b) => a.order - b.order);
```

Do not alphabetize topics.

Question row order is always:

```ts
[5, 10, 15, 20];
```

---

## 10. UI Foundation

### 10.1 Tailwind Design Direction

Use mobile-first classes by default.

Use a simple app container:

```text
min-h-dvh bg-slate-950 text-slate-50
```

Use readable cards:

```text
rounded-2xl border border-white/10 bg-white/5 shadow-sm
```

Use touch-friendly controls:

```text
min-h-11 px-4 py-3
```

Use visible focus states:

```text
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950
```

### 10.2 Required Shared UI Components

Build reusable UI components:

- `Button`
- `Card`
- `Input`
- `Select`
- `Field`
- `FieldError`
- `Tabs`
- `CoinDisplay`
- `ConfirmDialog`
- `ToastProvider`

### 10.3 CoinDisplay

Visual output must be:

```text
🪙 20
```

Implementation:

```tsx
export function CoinDisplay({ value }: { value: number }) {
  return (
    <span
      aria-label={`${value} coins`}
      className="inline-flex items-center gap-1 tabular-nums"
    >
      <span aria-hidden="true">🪙</span>
      <span>{value}</span>
    </span>
  );
}
```

Do not visually render the word `Coins`.

---

## 11. Toast System

Create `ToastProvider`.

Requirements:

- Toasts auto-dismiss after approximately 3 seconds.
- Use for:
  - `You won: Molly Tea`
  - `Configuration saved successfully.`
- Use `aria-live="polite"`.
- Position bottom or top; keep it unobtrusive.
- Toasts should not require user dismissal.

API:

```ts
type Toast = {
  id: string;
  message: string;
};

type ToastContextValue = {
  showToast(message: string): void;
};
```

Use `crypto.randomUUID()` for toast IDs.

---

## 12. Game State Model

Create `src/features/game/gameTypes.ts`.

```ts
export type GameStatus = "HOME" | "ACTIVE" | "GAME_OVER";
export type GameplayTab = "BOARD" | "WHEEL" | "SHOP";
export type ShopTab = "BUY" | "SELL";

export type QuestionRuntimeState =
  | "AVAILABLE"
  | "CORRECT"
  | "INCORRECT"
  | "UNAVAILABLE";

export type QuestionStateById = Record<string, QuestionRuntimeState>;

export type GameState = {
  gameStatus: GameStatus;
  playerCoins: number;
  activeTab: GameplayTab;
  activeShopTab: ShopTab;
  questionStates: QuestionStateById;
  ownedRewardIds: string[];
  soldRewardIds: string[];
  wheelRewardIds: string[];
  shopRewardIds: string[];
  activeQuestionId: string | null;
  isWheelSpinning: boolean;
  spinSnapshotRewardIds: string[] | null;
  selectedSpinRewardId: string | null;
  wheelRotationDeg: number;
};
```

`shopRewardIds` must always match the available rewards in `wheelRewardIds`.

---

## 13. Game Initialization

Create `src/features/game/gameInitialization.ts`.

Input:

```ts
initializeGameState(config: GameConfig): GameState
```

Rules:

- `gameStatus = "ACTIVE"`
- `playerCoins = 0`
- `activeTab = "BOARD"`
- `activeShopTab = "BUY"`
- `ownedRewardIds = []`
- `soldRewardIds = []`
- `wheelRewardIds = all config reward IDs`
- `shopRewardIds = all config reward IDs`
- `activeQuestionId = null`
- `isWheelSpinning = false`
- `spinSnapshotRewardIds = null`
- `selectedSpinRewardId = null`
- `wheelRotationDeg = 0`

For questions:

- Each configured question gets `AVAILABLE`.
- Missing board slots are not stored in `questionStates`; they are derived as `UNAVAILABLE`.

---

## 14. Game Selectors

Create `src/features/game/gameSelectors.ts`.

Required selectors:

```ts
getTopicById(config, topicId);
getQuestionById(config, questionId);
getRewardById(config, rewardId);
getQuestionsByTopicAndValue(config);
getBoardCellState(config, state, topicId, value);
getAvailableQuestions(config, state);
getUnansweredQuestions(config, state);
getWheelRewards(config, state);
getShopBuyRewards(config, state);
getOwnedRewards(config, state);
getSellValue(reward);
canSpin(config, state);
canBuyReward(state, reward);
canSellReward(state, reward);
isGameOver(config, state);
```

### 14.1 Game Over Logic

Implement exactly:

```ts
export function isGameOver(config: GameConfig, state: GameState): boolean {
  const wheelRewards = getWheelRewards(config, state);
  if (wheelRewards.length === 0) return true;

  const unansweredQuestions = getUnansweredQuestions(config, state);
  const ownedRewards = getOwnedRewards(config, state);
  const buyableRewardExists = getShopBuyRewards(config, state).some(
    (reward) => reward.coinValue <= state.playerCoins,
  );

  return (
    unansweredQuestions.length === 0 &&
    ownedRewards.length === 0 &&
    state.playerCoins < 5 &&
    !buyableRewardExists
  );
}
```

Wheel empty must short-circuit immediately.

---

## 15. Game Reducer

Create `src/features/game/gameReducer.ts`.

The reducer must be pure. It must not:

- Read localStorage.
- Write localStorage.
- Call timers.
- Call Math.random.
- Trigger toasts.
- Navigate routes.

### 15.1 Actions

```ts
export type GameAction =
  | { type: "START_NEW_GAME"; config: GameConfig }
  | { type: "SET_ACTIVE_TAB"; tab: GameplayTab }
  | { type: "SET_ACTIVE_SHOP_TAB"; tab: ShopTab }
  | { type: "OPEN_QUESTION"; questionId: string }
  | {
      type: "MARK_QUESTION";
      questionId: string;
      result: "CORRECT" | "INCORRECT";
      config: GameConfig;
    }
  | {
      type: "START_SPIN";
      rewardId: string;
      spinSnapshotRewardIds: string[];
      targetRotationDeg: number;
      config: GameConfig;
    }
  | { type: "FINISH_SPIN"; config: GameConfig }
  | { type: "BUY_REWARD"; rewardId: string; config: GameConfig }
  | { type: "SELL_REWARD"; rewardId: string; config: GameConfig };
```

### 15.2 Recompute Game Status Helper

After every terminal action, call:

```ts
function withRecomputedGameStatus(
  config: GameConfig,
  state: GameState,
): GameState {
  return isGameOver(config, state)
    ? { ...state, gameStatus: "GAME_OVER" }
    : state;
}
```

Terminal actions:

- `MARK_QUESTION`
- `FINISH_SPIN`
- `BUY_REWARD`
- `SELL_REWARD`
- `START_NEW_GAME`

### 15.3 Reducer Rules

#### OPEN_QUESTION

Allowed only if:

- game is active
- not game over
- no active question
- target question state is `AVAILABLE`
- wheel is not spinning

State changes:

```ts
activeQuestionId = questionId;
```

No coins awarded yet.

#### MARK_QUESTION

Allowed only if:

- active question matches `questionId`
- question has been opened
- question is available

If correct:

```ts
playerCoins += question.coinValue;
questionStates[questionId] = "CORRECT";
activeQuestionId = null;
```

If incorrect:

```ts
playerCoins unchanged
questionStates[questionId] = "INCORRECT"
activeQuestionId = null
```

Then recompute game over.

#### START_SPIN

Allowed only if:

- game is active
- player has at least 5 coins
- wheel has at least 1 reward
- not already spinning
- rewardId is in wheelRewardIds

State changes:

```ts
playerCoins -= 5;
isWheelSpinning = true;
spinSnapshotRewardIds = spinSnapshotRewardIds;
selectedSpinRewardId = rewardId;
wheelRotationDeg = targetRotationDeg;
```

Do not award the reward yet.

#### FINISH_SPIN

Allowed only if:

- isWheelSpinning is true
- selectedSpinRewardId is not null

State changes:

```ts
ownedRewardIds += selectedSpinRewardId
wheelRewardIds remove selectedSpinRewardId
shopRewardIds remove selectedSpinRewardId
isWheelSpinning = false
spinSnapshotRewardIds = null
selectedSpinRewardId = null
```

Then recompute game over.

#### BUY_REWARD

Allowed only if:

- game is active
- reward is in wheelRewardIds and shopRewardIds
- player has enough coins
- reward is not owned
- reward is not sold
- not spinning

State changes:

```ts
playerCoins -= reward.coinValue
ownedRewardIds += rewardId
wheelRewardIds remove rewardId
shopRewardIds remove rewardId
```

Then recompute game over.

#### SELL_REWARD

Allowed only if:

- game is active
- reward is owned
- reward is not sold
- not spinning

State changes:

```ts
playerCoins += reward.coinValue - 5
ownedRewardIds remove rewardId
soldRewardIds += rewardId
```

Do not add it back to wheel or shop.

Then recompute game over.

---

## 16. Wheel Algorithm

Create `src/features/game/wheel/wheelMath.ts`.

### 16.1 Equal Odds Selection

Use:

```ts
export function getRandomIndex(length: number): number {
  return Math.floor(Math.random() * length);
}
```

Precondition: `length > 0`.

The selected reward is determined before animation:

```ts
const wheelRewards = getWheelRewards(config, state);
const selectedIndex = getRandomIndex(wheelRewards.length);
const selectedReward = wheelRewards[selectedIndex];
```

### 16.2 Segment Geometry

Every reward has equal segment size:

```ts
segmentAngle = 360 / rewardCount;
```

Assume pointer is at top.

Compute center angle:

```ts
segmentCenterAngle = selectedIndex * segmentAngle + segmentAngle / 2;
```

Compute target rotation:

```ts
targetRotationDeg = currentRotationDeg + 360 * 6 + (360 - segmentCenterAngle);
```

Six full rotations creates visible spinning. Animation duration should be 4000ms.

### 16.3 Spin Snapshot

When spin starts, capture the current wheel reward order:

```ts
spinSnapshotRewardIds = wheelRewardIds;
```

Render the snapshot while spinning. Do not rebuild the wheel visually until the animation finishes.

After `FINISH_SPIN`, rebuild with remaining rewards.

### 16.4 Animation

Use CSS transform and transition:

```css
transition-transform duration-[4000ms] ease-out
```

Use `onTransitionEnd` to dispatch `FINISH_SPIN`.

Also set a fallback timeout of 4500ms in case the transition end event is missed.

### 16.5 Toast Timing

Show the win toast after `FINISH_SPIN`, not when spin starts.

Toast text:

```text
You won: [Reward Name]
```

---

## 17. Board Implementation

### 17.1 Board Layout

`BoardTab` renders:

```text
🪙 Current Coin Balance

[Jeopardy Board]
```

Use horizontal scrolling:

```tsx
<div className="overflow-x-auto pb-4">
  <div className="grid auto-cols-[minmax(8rem,10rem)] grid-flow-col gap-3">
    ...
  </div>
</div>
```

Each topic column:

- Fixed readable width.
- Topic title truncated with ellipsis.
- Rows always `5, 10, 15, 20`.

### 17.2 Missing Question Slot

If no question exists for `topicId + coinValue`:

- render unavailable placeholder
- not clickable
- accessible label: `No question available for [topic] [value] coins`

### 17.3 Available Question Cell

Visual text only:

```text
🪙 5
```

Click opens question modal immediately.

No confirmation.

### 17.4 Completed Cells

Correct cell:

```text
✓
```

Incorrect cell:

```text
✕
```

Do not show coin value, question text, or answer.

Use accessible labels:

```text
Correct answer completed
Incorrect answer completed
```

Completed cells are not clickable.

---

## 18. Question Modal

### 18.1 Required Behavior

The question modal must be:

- Centered over dim overlay.
- Non-dismissible.
- No close button.
- No outside-click close.
- Escape does nothing.
- Focus trapped.
- Board visible behind overlay.
- Board not interactive behind overlay.
- No route changes inside the app while modal is active.

### 18.2 Component State

The modal owns local UI state:

```ts
const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
```

Reset to false whenever `activeQuestionId` changes.

### 18.3 Before Reveal

Render:

```text
Topic: [Topic Name]
Value: 🪙 [Value]

Question:
[Question Text]

[Reveal Answer]
```

### 18.4 After Reveal

Render:

```text
Topic: [Topic Name]
Value: 🪙 [Value]

Question:
[Question Text]

Answer:
[Answer Text]

[Correct]
[Incorrect]
```

### 18.5 Marking Correct

Dispatch:

```ts
{ type: "MARK_QUESTION", questionId, result: "CORRECT", config }
```

### 18.6 Marking Incorrect

Dispatch:

```ts
{ type: "MARK_QUESTION", questionId, result: "INCORRECT", config }
```

### 18.7 Modal Layout

Avoid internal scrolling areas for question or answer text.

Use overlay-level scrolling only for very small screens:

```tsx
<div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-8">
  <div
    role="dialog"
    aria-modal="true"
    className="mx-auto w-full max-w-lg rounded-2xl bg-slate-950 p-5 shadow-xl"
  >
    ...
  </div>
</div>
```

Text should wrap naturally.

---

## 19. Wheel Tab Implementation

### 19.1 Layout

Wheel tab contains only:

```text
🪙 Current Coin Balance

[Animated Wheel]

[Spin Button]
```

If wheel empty:

```text
No rewards remain on the wheel.
```

Do not show:

- Remaining reward list.
- Probabilities.
- Reward count.
- Segment legend.

### 19.2 Spin Button Disabled Conditions

Disable when:

```ts
state.playerCoins < 5 ||
  state.wheelRewardIds.length === 0 ||
  state.isWheelSpinning ||
  state.gameStatus === "GAME_OVER";
```

No helper text required.

### 19.3 RewardWheel Visual

Use SVG or CSS `conic-gradient`.

Recommended: SVG for accurate labels.

For each segment:

- Equal arc size.
- Label is reward name only.
- No coin value on wheel.
- Long names truncate visually.

The pointer can be a small triangle at the top.

---

## 20. Shop Implementation

### 20.1 Shop Layout

Shop tab renders:

```text
🪙 Current Coin Balance

[Buy] [Sell]
```

Buy tab selected by default.

### 20.2 Buy Tab

Shows rewards from:

```ts
getShopBuyRewards(config, state);
```

This must equal wheel rewards.

Empty state:

```text
No rewards available to buy.
```

Card shows:

```text
Reward Name
🪙 Cost
Description, if present
[Buy]
```

Buy button disabled if:

```ts
state.playerCoins < reward.coinValue || state.gameStatus === "GAME_OVER";
```

No confirmation dialog.

### 20.3 Sell Tab

Shows owned rewards from:

```ts
getOwnedRewards(config, state);
```

Empty state:

```text
You don't own any rewards yet.
```

Card shows:

```text
Reward Name
Sell Value: 🪙 Y
Description, if present
[Sell]
```

Do not show original reward value on Sell cards.

Sell button disabled if:

```ts
state.gameStatus === "GAME_OVER";
```

Click Sell opens confirmation dialog.

### 20.4 Sell Confirmation Dialog

Text:

```text
Sell [Reward Name] for 🪙 [Sell Value]?

This reward will be permanently removed and cannot be reclaimed.

[Cancel]
[Sell]
```

Cancel: no state change.

Confirm: dispatch `SELL_REWARD`.

---

## 21. Reward Description Expansion

Use local card state per reward card.

Initial state:

```ts
expanded = false;
```

If description is long, show preview plus:

```text
[Show More]
```

When expanded:

```text
[Show Less]
```

Use independent state per card.

Recommended simple threshold:

```ts
description.length > 90;
```

Collapsed preview:

```ts
description.slice(0, 90) + "...";
```

Do not use markdown or rich text.

---

## 22. Game Over UI

### 22.1 Banner

When `gameStatus === "GAME_OVER"` show a banner at the top of each gameplay section or above tab content:

```text
Game Over
No more actions are available.
[New Game]
```

The board, wheel, and shop remain visible.

Do not show:

- Score screen.
- Results screen.
- Ranking.
- Grade.

### 22.2 New Game

If game is active and user clicks New Game:

Show confirmation:

```text
Start a new game?

Your current progress will be lost.

[Cancel]
[Start New Game]
```

If game is already over:

- Start new game immediately.
- Reset using currently saved configuration.
- Do not modify configuration.
- Select Board tab.

---

## 23. Leave Warnings

### 23.1 Gameplay Leave Warning

If gameplay is active and not game over, warn on:

- Refresh.
- Close tab.
- Navigate away.
- Leave route.

Message:

```text
Your current game progress will be lost. Are you sure you want to leave?
```

Implementation:

- Use `beforeunload` for browser refresh/close.
- Use guarded internal navigation components for app links/buttons.
- Use `window.confirm` for internal route changes.
- Do not persist gameplay to bypass this requirement.

### 23.2 Admin Unsaved Changes Warning

If admin draft is dirty, warn on:

- Refresh.
- Close tab.
- Navigate away.
- Change routes.

Message:

```text
You have unsaved changes. Are you sure you want to leave?
```

Implementation:

- Track dirty by comparing normalized draft to last saved normalized config.
- Use `beforeunload`.
- Use guarded route navigation for app buttons/links.
- If user leaves, discard draft.
- No Revert button.

---

## 24. Admin Implementation

### 24.1 Admin Load

On mount:

1. Load config from repository.
2. Convert loaded config to draft config.
3. If repository returned `malformed`, show inline warning at top.
4. Render editor sections.

### 24.2 Dirty Tracking

Maintain:

```ts
savedConfig: GameConfig;
draftConfig: DraftGameConfig;
isDirty: boolean;
```

Dirty check:

```ts
stableSerialize(normalizeDraftForComparison(draftConfig)) !==
  stableSerialize(savedConfig);
```

### 24.3 Topics Editor

Fields per row:

```text
Topic Name [input]
[Delete]
```

Add Topic:

- Adds draft topic with:
  - new ID from `crypto.randomUUID()`
  - empty name
  - order = current max order + 1

Delete Topic:

- Immediately removes topic.
- Immediately removes all draft questions with matching topicId.
- No confirmation.

Validation:

- Empty topic name shows inline error.

### 24.4 Questions Editor

Fields per row:

```text
Topic    [Dropdown]
Value    [5 | 10 | 15 | 20]
Question [Single-line input]
Answer   [Single-line input]
[Delete]
```

Add Question:

- Adds draft question with:
  - new ID
  - topicId = ""
  - coinValue = ""
  - questionText = ""
  - answerText = ""

Delete Question:

- Immediately removes question.
- No confirmation.

Validation:

- Topic required.
- Value required.
- Question required.
- Answer required.
- Duplicate topic/value invalid.

### 24.5 Rewards Editor

Fields per row:

```text
Reward Name [Single-line input]
Value       [20 | 25 | 30 | 35 | 40 | 45 | 50]
Description [Single-line input]
[Delete]
```

Add Reward:

- Adds draft reward with:
  - new ID
  - name = ""
  - description = ""
  - coinValue = ""

Delete Reward:

- Immediately removes reward.
- No confirmation.

Validation:

- Reward name required.
- Reward value required.
- Duplicate reward names allowed.

### 24.6 Save Configuration

On click:

1. Validate draft.
2. If invalid, show inline errors and do not save.
3. If valid, normalize to `GameConfig`.
4. Save via repository.
5. Update `savedConfig`.
6. Set dirty to false.
7. Show toast:

```text
Configuration saved successfully.
```

---

## 25. Accessibility Requirements

Implement:

- Semantic buttons, inputs, selects, labels.
- Visible focus states.
- Proper `disabled` attributes.
- Dialogs use `role="dialog"` and `aria-modal="true"`.
- Question modal traps focus.
- Confirmation dialog traps focus.
- Toast region uses `aria-live="polite"`.
- Correct icon has accessible label.
- Incorrect icon has accessible label.
- Coin display has accessible label but visually stays `🪙 N`.
- Do not use clickable divs.
- Do not hide focus outlines.
- Return focus to the selected board cell after question completion where practical.

---

## 26. Responsive Requirements

### 26.1 Mobile First

Default styles target mobile.

Use breakpoints only to enhance tablet/desktop.

### 26.2 Board

- Horizontal scroll.
- Columns keep readable width.
- Cells are large enough to tap.
- Long topic names truncate.

### 26.3 Bottom Tabs

Gameplay tabs:

```text
[Board] [Wheel] [Shop]
```

Use fixed bottom nav during gameplay.

Make sure content has bottom padding so nav does not cover content:

```text
pb-24
```

### 26.4 Admin

Admin fields stack vertically on mobile.

On desktop, fields may align in rows, but no separate pages or modals.

---

## 27. Performance Rules

- Keep domain logic pure and lightweight.
- Use React state only where needed.
- Do not memoize everything by default.
- Use `useMemo` only for derived lists that are recalculated from config/state, such as sorted rewards and board mappings.
- Use `useCallback` only where referential stability is needed for child props or hooks.
- Keep client components at route-level shells that need browser APIs and interactivity.
- Do not use Server Actions because V1 has no backend persistence.
- Do not use API routes.
- Do not use `dangerouslySetInnerHTML`.
- Use CSS transforms for wheel animation.

---

## 28. Testing Plan

### 28.1 Unit Tests

Create tests for:

Config validation:

- Empty topic name invalid.
- Empty question invalid.
- Empty answer invalid.
- Missing topic invalid.
- Invalid question value invalid.
- Duplicate topic/value invalid.
- Empty reward name invalid.
- Invalid reward value invalid.
- Duplicate reward names valid.
- Empty rewards/questions can save but cannot start game.

Repository:

- Missing localStorage returns default config.
- Valid localStorage returns saved config.
- Malformed JSON does not crash.
- Save writes to correct key.

Sorting:

- Rewards sort by value ascending.
- Same value sorts by name.
- Same value and name sorts by ID.

Game reducer:

- New game starts with 0 coins.
- Correct answer adds coin value.
- Incorrect answer adds 0.
- Completed question cannot reopen.
- Spin start deducts 5.
- Spin finish adds reward to owned.
- Spin finish removes reward from wheel and shop.
- Cannot spin without 5 coins.
- Cannot buy unaffordable reward.
- Buying removes reward from wheel and shop.
- Selling adds `coinValue - 5`.
- Selling permanently removes reward.
- Wheel empty causes immediate game over.
- No meaningful actions causes game over.
- Owned rewards prevent no-meaningful-actions game over until sold.

Wheel math:

- Each reward has equal segment size.
- Selected index maps to correct target rotation.
- One remaining reward has 100% chance.

### 28.2 Component Tests

Use React Testing Library for:

- Home Start Game invalid config shows errors.
- Admin add/edit/delete topic.
- Deleting topic removes child questions.
- Admin duplicate question slot shows inline error.
- Save success shows toast.
- Board renders columns in configured order.
- Missing question slots render placeholders.
- Question modal cannot be dismissed by Escape.
- Reveal answer shows both question and answer.
- Correct/Incorrect updates board cell.
- Buy card disables when unaffordable.
- Sell card confirmation cancel does nothing.
- Sell confirmation confirm updates coins and inventory.
- Reward description Show More/Show Less works independently per card.

### 28.3 E2E Tests

Use Playwright for:

1. Visit Home.
2. Go to Admin.
3. Add topic/question/reward.
4. Save configuration.
5. Return Home.
6. Start game.
7. Answer question correctly.
8. Verify coins.
9. Buy reward.
10. Verify reward appears in Sell tab.
11. Sell reward.
12. Verify coins increase by sell value.
13. Trigger game over state.
14. Start new game.
15. Verify reset state.

Use fake/minimal seeded config for deterministic tests.

---

## 29. Build Order for Agent

### Phase 1: Foundation

- Create Next app.
- Add testing setup.
- Add shared UI components.
- Add ToastProvider.
- Add TypeScript strict config.
- Add Tailwind base layout.

Acceptance gate:

```bash
npm run verify
```

### Phase 2: Config Domain

- Add config types.
- Add default reward dataset.
- Add config repository abstraction.
- Add localStorage repository.
- Add config validation.
- Add sorting helpers.
- Add unit tests.

Acceptance gate:

- Config tests pass.
- Malformed localStorage test passes.
- Duplicate question slot test passes.

### Phase 3: Admin

- Build Admin page.
- Add topics editor.
- Add questions editor.
- Add rewards editor.
- Add inline validation.
- Add save behavior.
- Add dirty state.
- Add unsaved changes warning.
- Add save toast.

Acceptance gate:

- Admin can create valid config.
- Invalid config cannot save.
- Saved config survives refresh.
- Unsaved changes warning works.

### Phase 4: Home + Start Game Validation

- Build Home screen.
- Add Start Game.
- Add Admin navigation.
- Add startup validation.
- If valid, navigate to `/game`.
- If invalid, show validation errors.

Acceptance gate:

- Default config blocks game start because no questions exist.
- Valid admin-created config allows game start.

### Phase 5: Game State

- Add game types.
- Add initialization.
- Add selectors.
- Add reducer.
- Add reducer tests.

Acceptance gate:

- All core economy and game-over tests pass.

### Phase 6: Board + Question Modal

- Build gameplay shell.
- Add bottom tabs.
- Build Board tab.
- Add board grid.
- Add unavailable placeholders.
- Add question modal.
- Add reveal/correct/incorrect flow.
- Add focus trap and non-dismissible behavior.

Acceptance gate:

- Correct question adds coins.
- Incorrect question adds no coins.
- Completed cells show only ✓ or ✕.
- Completed cells cannot reopen.
- Modal cannot dismiss early.

### Phase 7: Shop

- Build Shop tab.
- Add Buy/Sell secondary tabs.
- Add reward cards.
- Add Buy behavior.
- Add Sell confirmation.
- Add description expansion.
- Add empty states.

Acceptance gate:

- Buying removes reward from wheel and Buy tab.
- Selling permanently removes reward.
- Sell value is purchase value minus 5.
- Unaffordable buy buttons are disabled.

### Phase 8: Wheel

- Build Wheel tab.
- Build animated wheel.
- Implement equal segment rendering.
- Implement spin selection before animation.
- Deduct coins on spin start.
- Award reward after animation.
- Show win toast after finish.
- Rebuild wheel after reward removal.

Acceptance gate:

- Spin costs exactly 5.
- Spin button disables while spinning.
- Winner is removed from wheel and shop.
- Every segment is equal size.
- Wheel empty causes immediate game over.

### Phase 9: Game Over + New Game

- Add game over banner.
- Keep board/wheel/shop visible.
- Disable impossible/game-over actions.
- Add New Game button.
- Add active game New Game confirmation.
- Reset using currently saved config.

Acceptance gate:

- Wheel empty immediately game-over.
- No meaningful actions game-over.
- New Game resets gameplay but not config.

### Phase 10: Leave Warnings + Polish

- Add active gameplay leave warning.
- Add route leave guards.
- Add mobile-first polish.
- Add accessibility pass.
- Add E2E tests.

Acceptance gate:

```bash
npm run verify
npm run e2e
```

---

## 30. Final Manual QA Checklist

Currency:

- Player starts at `🪙 0`.
- Coin display never says `Coins` visually.
- Coins never go negative.
- Correct question adds value.
- Incorrect question adds 0.
- Spin deducts 5.
- Buy deducts reward value.
- Sell adds reward value minus 5.

Board:

- Topics show left to right by admin order.
- Rows always 5, 10, 15, 20.
- Missing question slots are placeholders.
- Available cells show only coin value.
- Completed cells show only ✓ or ✕.
- Completed cells cannot be clicked.

Question modal:

- Opens immediately.
- Cannot close before completion.
- Reveal shows question and answer together.
- Correct/Incorrect closes modal and updates board.

Wheel:

- Shows only coin balance, wheel, spin button.
- No reward list or probabilities.
- Segments equal size.
- Labels show reward names only.
- Spin visibly animates/decelerates.
- Winner selected before animation.
- Winner awarded after animation.
- Win toast appears.

Shop:

- Buy tab shows wheel rewards.
- Sell tab shows owned rewards.
- Buy is immediate.
- Sell requires confirmation.
- Sold reward cannot return.

Admin:

- `/admin` accessible.
- No auth.
- Inline editing only.
- Save is explicit.
- Invalid fields show inline errors.
- Duplicate question slots blocked.
- Duplicate reward names allowed.
- Unsaved changes warning works.
- Successful save toast appears.

Persistence:

- Config survives refresh.
- Gameplay does not survive refresh.
- Active gameplay refresh/leave warns user.
- localStorage uses only `jeopardy-wheel-config`.

Game over:

- Wheel empty immediately ends game.
- No meaningful actions ends game.
- No score/ranking/results screen.
- New Game resets gameplay only.

---

## 31. Do Not Implement

Do not implement:

- Backend API.
- Database.
- Auth.
- Admin password.
- Import config button.
- Export config button.
- Reward images.
- Markdown.
- Rich text.
- AI grading.
- Speech recognition.
- Score ranking.
- Leaderboard.
- Multiplayer.
- Player profiles.
- Persisted gameplay.
- Weighted wheel odds.
- Duplicate reward ownership.
- Confirmation for buying.
- Confirmation for opening questions.
- Close button on question modal.

---

## 32. Refactor Implementation Plan for Updated Requirements

This section supersedes earlier admin/configuration sections of this implementation plan. Follow the updated PRD in `jeopardy-coin-board-reward-wheel-prd.md` when this section conflicts with older instructions.

### 32.1 Refactor Position

The updated implementation should use:

- `src/features/config/Data.js` as the shipped baseline data source.
- Browser local storage only for edit-mode overrides.
- In-memory React state for gameplay progress.
- No Admin route, Admin button, or arbitrary admin configuration UI.
- A fixed 5-column by 4-row board.
- Query-gated edit mode on `/game?isEditable=true`.

Do not preserve the old admin configuration model. Remove or rename code that implies local storage is the canonical game configuration source.

### 32.2 Data Consolidation

Create:

```text
src/features/config/Data.js
```

Move into `Data.js`:

- Existing topics from `defaultQuestionsAndTopics.json`.
- Existing questions and answers from `defaultQuestionsAndTopics.json`.
- Existing rewards from `defaultConfig.ts`.
- Reward value options.

Recommended export:

```js
export const gameData = {
  version: 2,
  board: {
    columns: [
      {
        id: "topic-food",
        title: "Food",
        x: 0,
        cells: [
          {
            id: "question-food-0",
            coordinate: { x: 0, y: 0 },
            value: 5,
            question: "Question text",
            answer: "Answer text",
          },
        ],
      },
    ],
  },
  rewards: [
    {
      id: "reward-example",
      name: "Reward name",
      value: 50,
    },
  ],
  rewardValueOptions: [40, 45, 50, 55, 60, 65, 70, 75, 80],
};
```

Implementation guidance:

- Add a data adapter that maps `gameData` to the existing runtime `GameConfig` shape first.
- Preserve current gameplay behavior while replacing the source of config data.
- After behavior is stable, simplify types if the adapter becomes unnecessary.

### 32.3 Data Validation

Add validation for the `Data.js` shape before starting gameplay.

Validation must require:

- Exactly 5 columns.
- Column `x` values from `0` through `4`.
- Exactly 4 cells per column.
- Cell `y` values from `0` through `3`.
- Unique cell IDs.
- Unique cell coordinates.
- Non-empty topic titles.
- Non-empty questions after trimming whitespace.
- Non-empty answers after trimming whitespace.
- Board values of `5`, `10`, `15`, and `20`.
- At least 1 reward.
- Unique reward IDs.
- Non-empty reward names after trimming whitespace.
- Reward values included in `gameData.rewardValueOptions`.

If validation fails:

- Block game startup.
- Show readable validation errors.
- Do not crash the page.

### 32.4 Edit Override Storage

Replace the old config repository concept with edit override storage.

Use a new local storage key, for example:

```text
jeopardy-wheel-edit-overrides
```

Store only changed fields, not a full arbitrary game configuration.

Suggested override shape:

```ts
type EditOverrides = {
  questionsById: Record<
    string,
    {
      question?: string;
      answer?: string;
    }
  >;
  rewardsById: Record<
    string,
    {
      name?: string;
      value?: number;
    }
  >;
};
```

Runtime data should be derived as:

```text
validated Data.js baseline + validated edit overrides
```

Rules:

- Missing override key means no edits.
- Malformed override JSON should be ignored with a non-blocking warning.
- Invalid individual overrides should be ignored or rejected without corrupting baseline data.
- Clearing local storage returns the game to `Data.js` baseline.

### 32.5 Admin Removal

Remove:

- `src/app/admin/page.tsx`.
- Home screen Admin button.
- `src/features/config/admin/*`.
- Admin-specific tests.
- Admin unsaved changes guard.
- Admin configuration save flow.
- Add/delete/reorder topic, question, and reward workflows.
- Local-storage-backed full config loading as the game startup source.

Keep only reusable UI primitives such as `Input`, `Select`, `Button`, `Field`, `FieldError`, `ToastProvider`, and `ConfirmDialog`.

If any old config files remain temporarily during the refactor, they must not be used by runtime startup.

### 32.6 Fixed Board Rendering

Refactor the board so the grid source is explicit board cell data, not dynamic topic count plus `QUESTION_COIN_VALUES.map`.

Requirements:

- Always render exactly 5 columns.
- Always render exactly 4 rows.
- Use the column order and coordinates from validated data.
- Display values `5`, `10`, `15`, and `20`.
- Do not render missing-question placeholders for valid data.
- Preserve current visual treatment for available and completed cells.
- Completed cells remain non-clickable in play mode.

The board can still use horizontal scrolling if needed for mobile readability, but it should not become dynamic-width based on arbitrary topic counts.

### 32.7 Query-Gated Edit Mode

Update `/game` to read the query string.

Behavior:

- If `isEditable=true`, show a top-right edit-mode toggle.
- If `isEditable` is absent or any other value, hide the toggle.
- The toggle controls an `isEditMode` client state flag.
- Saved edits remain visible after toggling edit mode off.
- Edit mode is not available from the Home screen.

When `isEditMode` is on:

- Disable gameplay mutation actions.
- Do not allow answering questions, buying rewards, selling rewards, or spinning the wheel.
- Keep navigation between Board, Wheel, and Shop available unless it creates confusing state.

### 32.8 Board Editing

Extend the existing question popup to support two modes.

Play mode:

- Preserve existing Reveal Answer, Correct, and Incorrect flow.

Edit mode:

- Clicking any board card opens the popup.
- Popup shows a single-line input for question.
- Popup shows a single-line input for answer.
- Inputs are pre-populated with latest saved runtime values.
- Popup shows Save and Cancel buttons.

Save behavior:

- Save one board cell at a time.
- Trim question and answer values.
- Reject empty question.
- Reject empty answer.
- Show inline validation errors near invalid fields.
- Write valid edits to edit override storage.
- Update runtime data visible in the board and popup.
- Close the popup after successful save.

Cancel behavior:

- Discard draft question and answer values.
- Keep previously saved values.
- Close the popup.

### 32.9 Reward Editing

Add reward editing to the existing Shop tab.

Do not create a new Rewards tab.
Do not put reward editing in the Wheel tab.

In edit mode, show all rewards from runtime data, not only available rewards.

Each reward editor should show:

- Single-line input for reward name.
- Dropdown for reward value.
- Save button.
- Cancel button.

Reward value options come from:

```text
gameData.rewardValueOptions
```

Save behavior:

- Save one reward at a time.
- Trim reward name.
- Reject empty reward name.
- Reject values not included in `rewardValueOptions`.
- Show inline validation errors near invalid fields.
- Write valid edits to edit override storage.
- Update reward displays across Wheel, Shop Buy, Shop Sell, inventory, and spin results.

Cancel behavior:

- Discard draft reward name and value.
- Keep previously saved values.

### 32.10 Game State and Derived Data

Keep gameplay progress in memory only.

Important implementation detail:

- Gameplay state should track stable IDs.
- Display data should be read from the latest runtime data by ID.

This allows reward/question text edits to appear across the UI without rewriting gameplay progress state.

When saved edit overrides change:

- Rebuild derived runtime data from `Data.js` plus overrides.
- Preserve gameplay state by stable IDs when possible.
- If a saved override is invalid, reject it before it can break runtime selectors.

### 32.11 Testing Updates

Remove or rewrite tests that assert old Admin behavior.

Add unit tests for:

- `Data.js` validation accepts the shipped baseline.
- Validation rejects fewer or more than 5 columns.
- Validation rejects fewer or more than 4 rows per column.
- Validation rejects duplicate coordinates.
- Validation rejects empty question text.
- Validation rejects empty answer text.
- Validation rejects empty reward name.
- Validation rejects invalid reward value.
- Edit override merge preserves baseline values when no override exists.
- Edit override merge applies question, answer, reward name, and reward value overrides.

Add component tests for:

- Edit toggle appears for `/game?isEditable=true`.
- Edit toggle is hidden without the query param.
- Board edit popup pre-populates current question and answer.
- Board edit Save rejects empty question.
- Board edit Save rejects empty answer.
- Board edit Cancel discards draft changes.
- Reward edit UI appears in the Shop tab during edit mode.
- Reward edit Save rejects empty reward name.
- Reward edit Save rejects invalid reward value.
- Reward edit Cancel discards draft changes.

Add e2e coverage for:

- Start Game works without Admin.
- Board still supports normal question gameplay in play mode.
- `/game?isEditable=true` exposes edit mode.
- Saved board edits appear after reopening the card.
- Saved reward edits appear in Shop and Wheel displays.

### 32.12 Manual QA Checklist for Updated Requirements

Data:

- Game starts from `Data.js`.
- Clearing local storage restores baseline data.
- Malformed edit overrides do not crash the game.

Admin removal:

- Home screen has no Admin button.
- `/admin` is removed or no longer reachable as an Admin UI.
- No admin editor UI remains in normal navigation.

Board:

- Board always renders 5 columns and 4 rows.
- Every cell has a question and answer.
- Values are 5, 10, 15, and 20.
- Topic names are not editable.

Edit mode:

- Toggle appears only on `/game?isEditable=true`.
- Toggle does not appear on `/game`.
- Gameplay actions are disabled while edit mode is on.

Board edits:

- Question and answer inputs are pre-populated.
- Empty question cannot save.
- Empty answer cannot save.
- Save updates the visible question and answer.
- Cancel keeps the previous values.

Reward edits:

- Reward editing is in the Shop tab.
- All rewards are editable, regardless of current gameplay availability.
- Empty reward name cannot save.
- Reward value must come from the dropdown.
- Save updates reward displays across the app.
- Cancel keeps the previous values.

Verification:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run e2e
```

### 32.13 Cell Power-Up Implementation Plan

Add cell power ups as an additive gameplay system based on the updated PRD.

Data configuration:

- Support one optional power up per board cell in `gameData`.
- Use this per-cell shape:

```js
powerUp: {
  type: "DOUBLE_BALANCE_ON_CORRECT";
}
```

- Supported power-up types are:
  - `DOUBLE_BALANCE_ON_CORRECT`
  - `HALVE_BALANCE_ON_INCORRECT`
  - `MYSTERY_GIFT`
  - `BONUS_ON_CORRECT`
  - `DOUBLE_SPIN_COST_ON_INCORRECT`
  - `HALVE_SPIN_COST_ON_CORRECT`

Validation rules:

- A cell may have at most one optional power up.
- Unknown power-up types are rejected.
- Power ups are configured only in `gameData`.
- Edit mode must not expose, add, remove, or modify power ups.

Gameplay behavior:

- Power ups are hidden on the board.
- Selecting a powered cell reveals a compact inline power-up banner in the question modal.
- Normal question scoring applies before power-up coin effects.
- `DOUBLE_BALANCE_ON_CORRECT` doubles the current coin balance only after a correct answer and after normal or streak question coins are awarded.
- `HALVE_BALANCE_ON_INCORRECT` halves the current coin balance only after an incorrect answer and rounds up.
- `MYSTERY_GIFT` reveals a message only and must not mutate coins, rewards, inventory, shop, or wheel state.
- `BONUS_ON_CORRECT` adds 10 coins only after a correct answer and after normal or streak question coins are awarded.
- `DOUBLE_SPIN_COST_ON_INCORRECT` sets the next spin cost to 40 coins only when that configured cell is answered incorrectly.
- `HALVE_SPIN_COST_ON_CORRECT` sets the next spin cost to 10 coins only when that configured cell is answered correctly.

Runtime state:

- Track `correctStreakCount`.
- Track `isStreakMultiplierActive`.
- Track `nextSpinCost`.

Streak behavior:

- Each correct answer increments `correctStreakCount`.
- The 2x streak multiplier activates on the third consecutive correct answer.
- The third consecutive correct answer receives the 2x multiplier.
- The multiplier remains active until the next incorrect answer.
- Incorrect answers reset `correctStreakCount` and set `isStreakMultiplierActive` to `false`.

Spin-cost behavior:

- A modified cost applies to the next spin only.
- Starting a spin resets the next spin cost to 20 coins.
- New Game resets `correctStreakCount`, `isStreakMultiplierActive`, and `nextSpinCost`.

Power-up test additions:

- Config validation accepts valid power-up types.
- Config validation rejects unknown power-up types.
- Modal reveals the power-up banner only after selecting a powered cell.
- Correct plus double balance applies after normal and streak question coins.
- Incorrect plus halve balance rounds up.
- Mystery Gift shows a message only.
- Bonus 10 applies only on correct answers.
- Third consecutive correct answer gets 2x and keeps the multiplier active.
- Incorrect answer resets streak and disables the multiplier.
- Spin-cost power ups apply on the matching result and reset after the next spin.
- New Game resets all power-up runtime state.
