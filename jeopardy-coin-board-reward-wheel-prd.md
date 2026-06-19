# PRD: Jeopardy Coin Board + Reward Wheel Game

## 1. Product Overview

This product is a single-player game that combines a fixed Jeopardy-style question board, a coin economy, an animated reward wheel, and a reward shop.

The player answers questions to earn coins. Coins can be spent to spin a reward wheel or directly buy rewards from a shop. Rewards can later be sold for coins, but selling a reward permanently removes it from the game.

The game is not designed to measure whether the player "did well." There is no score ranking, leaderboard, win/loss judgment, or final performance grade. The goal is to let the player progress through a finite set of questions, rewards, coins, spins, purchases, and sales until no meaningful actions remain or the reward wheel is empty.

The game configuration is defined by one static data source: `src/features/config/Data.js`. In-game edit mode allows targeted edits to existing questions, answers, reward names, and reward values when enabled by query string.

---

## 2. Core Concept

The game has six main systems:

1. **Jeopardy Board**
   - Player selects coin-value questions from a fixed 5-column by 4-row board.
   - Player answers out loud.
   - Player reveals the answer.
   - Player self-marks Correct or Incorrect.

2. **Coins**
   - Single game currency.
   - Earned from correctly answered questions.
   - Spent on wheel spins and shop purchases.
   - Earned from selling owned rewards.

3. **Reward Wheel**
   - Costs coins per spin.
   - Contains available rewards.
   - Every reward on the wheel has equal odds.
   - Winning a reward removes it from both the wheel and shop.

4. **Shop**
   - Buy tab: purchase available rewards directly using coins.
   - Sell tab: sell owned rewards for coins.
   - Sold rewards are permanently removed from the game.

5. **Edit Mode**
   - Available only on `/game?isEditable=true`.
   - Uses a top-right toggle to switch between play mode and edit mode.
   - Supports editing existing board questions, board answers, reward names, and reward values.
   - Does not support admin screens, arbitrary configuration, adding items, deleting items, or topic editing.

6. **Cell Power Ups**
   - Optional hidden effects configured per board cell in `Data.js`.
   - Hidden on the board until the question is selected.
   - Revealed inside the question modal.
   - Can affect coin balance, streak behavior, selling availability, or show a Mystery Gift message.
   - Are not editable through edit mode.

---

## 3. Goals

### 3.1 Player Goals

The player should be able to:

- Start a new game from a simple home screen.
- Answer questions to earn coins.
- See their coin balance during gameplay.
- Spend coins to spin a wheel.
- Spend coins to buy rewards directly.
- Own rewards.
- Sell owned rewards for coins.
- Continue playing until the game naturally ends.
- Understand when no more meaningful actions are available.

### 3.2 Editor Goals

When edit mode is enabled, the editor should be able to:

- Edit the question text for an existing board cell.
- Edit the answer text for an existing board cell.
- Edit the name for an existing reward.
- Edit the value for an existing reward using a dropdown.
- Save one edited board cell or one edited reward at a time.
- Cancel an edit without saving.
- See saved edits reflected wherever that question, answer, or reward appears.

### 3.3 Product Goals

The product should:

- Be simple and easy to understand.
- Be mobile-first while still supporting tablet and desktop.
- Keep the economy finite and non-loopable.
- Use one static data source for baseline questions, answers, topics, board coordinates, rewards, and reward value options.
- Keep the board fixed at exactly 5 columns and 4 rows.
- Prevent empty questions, answers, and reward names from being saved.
- Prevent duplicate or missing board coordinates.
- Remove all admin-era configuration flows.
- Be buildable as a frontend-only application.

---

## 4. Non-Goals

The product does not need to support:

- Multiplayer.
- Teams.
- Player profiles.
- User accounts.
- Admin authentication.
- Admin routes or admin screens.
- Arbitrary topic creation.
- Arbitrary question creation.
- Arbitrary reward creation.
- Deleting topics, board cells, questions, or rewards.
- Editing topic names.
- Leaderboards.
- Final score ranking.
- AI answer grading.
- Speech recognition.
- Automatic correctness detection.
- Persisted gameplay progress.
- Backend database.
- Backend API.
- Importing configuration through the UI.
- Reward images.
- Rich text editing.
- Markdown editing.
- Full WCAG audit.

---

## 5. Users

### 5.1 Player

The player is the person playing the game.

There is exactly one player.

The player has:

- One coin balance.
- One reward inventory.
- One gameplay session.
- One current board state.
- One current wheel state.

### 5.2 Editor

The editor is a user with access to `/game?isEditable=true`.

There is no authentication or permission model.

The editor can:

- Toggle edit mode on or off from the game screen.
- Edit existing board question and answer text.
- Edit existing reward names and values.
- Save or cancel one edited item at a time.

The editor cannot:

- Access an Admin screen.
- Add or delete topics.
- Add or delete board cells.
- Add or delete rewards.
- Edit topic names.
- Change the board dimensions.

---

## 6. Application Flow

### 6.1 Home Screen

When the application opens, the user sees a minimal Home screen.

Home screen contains:

```text
[Start Game]
```

The Home screen should not show:

- Admin button.
- Topic count.
- Question count.
- Reward count.
- Configuration summary.
- Previous game history.

### 6.2 Start Game Flow

When the user clicks **Start Game**:

```text
Click Start Game
↓
Validate Data.js-derived game data
↓
If valid, initialize new gameplay state
↓
Open Board tab
```

If data validation fails:

```text
Click Start Game
↓
Validation fails
↓
Game does not start
↓
Show validation errors
```

Startup validation requires:

- Exactly 5 board columns.
- Exactly 4 board cells per column.
- Exactly one board cell per coordinate.
- Non-empty topic titles.
- Non-empty question text.
- Non-empty answer text.
- At least 1 reward.
- Non-empty reward names.
- Valid reward values.

### 6.3 Edit Mode Entry

Edit mode is available only when the game URL contains:

```text
?isEditable=true
```

When this query parameter is present:

- A top-right edit-mode toggle appears on the game screen.
- The toggle switches between play mode and edit mode.
- Edit mode is only exposed on the game page.

When this query parameter is absent or any other value:

- The edit-mode toggle is hidden.
- The game behaves as a normal play-only experience.

---

## 7. Data Source

### 7.1 Canonical Data File

The app uses one canonical baseline data file:

```text
src/features/config/Data.js
```

`Data.js` contains:

- Topics.
- Board columns.
- Board cell coordinates.
- Board cell values.
- Board cell power ups.
- Questions.
- Answers.
- Rewards.
- Reward value options.

All game initialization, board rendering, reward rendering, wheel rendering, and edit-mode default values derive from this file.

### 7.2 Recommended Data Shape

`Data.js` should export a named object:

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
            powerUp: { type: "DOUBLE_BALANCE_ON_CORRECT" },
          },
          {
            id: "question-food-1",
            coordinate: { x: 0, y: 1 },
            value: 10,
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

### 7.3 Data Rules

The data model must enforce:

- Exactly 5 columns.
- Column `x` values from `0` through `4`.
- Exactly 4 cells per column.
- Cell `y` values from `0` through `3`.
- Unique cell IDs.
- Unique cell coordinates.
- Non-empty topic titles.
- Non-empty questions.
- Non-empty answers.
- Board values of `5`, `10`, `15`, and `20`.
- Optional board cell power ups must use a supported power-up type.
- Non-empty reward names.
- Reward values selected from `rewardValueOptions`.

### 7.4 Edit Overrides

`Data.js` is the shipped baseline source of truth.

Saved edit-mode changes persist as browser local storage overrides.

Runtime data is derived from:

```text
Data.js baseline + saved edit overrides
```

Behavior:

- Save writes an override to local storage.
- Cancel discards the current draft.
- Reopening an edited item shows the latest saved value.
- Clearing local storage returns the app to the `Data.js` baseline.
- Local storage stores only edit overrides, not arbitrary admin configuration.

---

## 8. Currency System

### 8.1 Currency Name

The game has exactly one currency.

The currency is called:

```text
Coins
```

### 8.2 Currency Display Format

Coin values should be displayed using a coin icon plus number:

```text
🪙 5
🪙 20
🪙 50
```

Do not display:

```text
5 points
20 pts
Score: 50
```

### 8.3 Coin Balance Visibility

The coin balance is only shown during gameplay.

It should appear at the top of each gameplay section:

- Board.
- Wheel.
- Shop.

The coin balance does not need to appear on the Home screen.

---

## 9. Jeopardy Board

### 9.1 Board Structure

The Jeopardy board is always a fixed grid:

```text
5 columns x 4 rows
```

The 5 columns represent topics.

The 4 rows represent fixed values:

```text
🪙 5
🪙 10
🪙 15
🪙 20
```

Example:

```text
Topic 1    Topic 2    Topic 3    Topic 4    Topic 5
----------------------------------------------------
🪙 5       🪙 5       🪙 5       🪙 5       🪙 5
🪙 10      🪙 10      🪙 10      🪙 10      🪙 10
🪙 15      🪙 15      🪙 15      🪙 15      🪙 15
🪙 20      🪙 20      🪙 20      🪙 20      🪙 20
```

The rendered board must not depend on dynamic topic counts or dynamic question value lists.

### 9.2 Coordinates

Each board cell must have an explicit coordinate:

```text
x = column index
y = row index
```

Valid coordinates:

```text
x: 0-4
y: 0-3
```

Each coordinate must map to exactly one board cell.

### 9.3 Topic Display

Topic names come from `Data.js`.

Topic names are not editable in the UI.

Long topic names should be truncated with ellipsis while preserving a readable column layout.

### 9.4 Question Values

Question values remain fixed:

```text
5
10
15
20
```

Each column should contain exactly one cell for each value.

### 9.5 Missing Questions

Missing questions are invalid in the baseline data.

Because the board is always 5 by 4, every cell must have:

- A coordinate.
- A value.
- A question.
- An answer.

---

## 10. Question Gameplay

### 10.1 Play Mode Question Flow

In play mode, selecting an available board cell opens the question popup.

The popup shows:

- Topic.
- Coin value.
- Question text.
- Reveal Answer button.

After the player reveals the answer, the popup shows:

- Answer text.
- Correct button.
- Incorrect button.

If the player marks Correct:

- The player earns coins equal to the question value.
- The question becomes completed.
- The cell is no longer selectable.

If the player marks Incorrect:

- The player earns no coins.
- The question becomes completed.
- The cell is no longer selectable.

### 10.2 Question States

Each question has one runtime state:

```text
Available
Correct
Incorrect
Unavailable
```

Because baseline data requires every board cell to have a question, `Unavailable` is reserved for defensive validation or future system states.

---

## 11. Cell Power Ups

### 11.1 Power-Up Configuration

Each board cell may have at most one optional power up.

Power ups are configured only in `gameData`. Edit mode must not expose, add, remove, or modify power ups.

Power-up configuration uses a string type:

```js
powerUp: {
  type: "DOUBLE_BALANCE_ON_CORRECT";
}
```

Supported power-up types:

- `DOUBLE_BALANCE_ON_CORRECT`
- `HALVE_BALANCE_ON_INCORRECT`
- `MYSTERY_GIFT`
- `BONUS_ON_CORRECT`
- `DISABLE_SELLING_ON_INCORRECT`

### 11.2 Power-Up Reveal

Power ups are hidden on the board.

When a powered cell is selected, the question modal immediately reveals a compact inline power-up banner.

The banner should show the power-up name and effect.

Power ups should not be revealed before the player selects the cell.

### 11.3 Power-Up Effects

Normal question scoring applies before cell power-up coin effects.

Power-up effects:

- `DOUBLE_BALANCE_ON_CORRECT`: if the answer is marked Correct, first award normal question coins, then double the current coin balance.
- `HALVE_BALANCE_ON_INCORRECT`: if the answer is marked Incorrect, halve the current coin balance and round up.
- `MYSTERY_GIFT`: reveal a Mystery Gift message when the question is selected. This is display-only and must not change coins, rewards, inventory, shop, or wheel state.
- `BONUS_ON_CORRECT`: if the answer is marked Correct, first award normal question coins, then add 10 bonus coins.
- `DISABLE_SELLING_ON_INCORRECT`: if the answer is marked Incorrect, disable selling until the next correct answer.

### 11.4 Correct Streak Multiplier

Correct answer streaks are a global gameplay rule.

Runtime state must track:

- `correctStreakCount`
- `isStreakMultiplierActive`

Rules:

- Each Correct answer increments `correctStreakCount`.
- The global 2x streak multiplier activates on the third consecutive Correct answer.
- The third consecutive Correct answer receives the 2x multiplier.
- The multiplier remains active for future Correct answers.
- The multiplier ends on the next Incorrect answer.
- Incorrect answers reset `correctStreakCount` to `0`.
- New Game resets streak state.

### 11.5 Selling Lock

Selling lock is triggered only by `DISABLE_SELLING_ON_INCORRECT`.

Runtime state must track:

- `isSellingLocked`

Rules:

- If a cell with `DISABLE_SELLING_ON_INCORRECT` is marked Incorrect, selling is disabled.
- While selling is locked, Sell actions are disabled.
- The Sell tab should explain that selling is locked until the next correct answer.
- The selling lock clears on the next Correct answer.
- New Game resets selling lock state.

---

## 12. Board Edit Mode

### 12.1 Board Edit Entry

Board edit mode is available only when:

- The URL contains `?isEditable=true`.
- The user turns on the top-right edit-mode toggle.
- The active gameplay tab is Board.

### 12.2 Board Edit Display

In board edit mode:

- The board visually shows the same grid as play mode.
- Clicking a card opens the same modal-style popup surface.
- Gameplay mutation actions are disabled while edit mode is active.

The popup shows:

- Single-line text input for question.
- Single-line text input for answer.
- Save button.
- Cancel button.

The question and answer inputs are pre-populated with the latest saved values.

### 12.3 Board Edit Validation

Save is allowed only when:

- Question text is not empty after trimming whitespace.
- Answer text is not empty after trimming whitespace.

Invalid saves should:

- Keep the popup open.
- Show a clear validation error near the invalid input.
- Not update local storage.
- Not update the displayed saved value.

### 12.4 Board Edit Save and Cancel

Save behavior:

- Saves one board cell at a time.
- Trims input values before saving.
- Writes the edit override to local storage.
- Updates the board and popup to show the saved values.
- Closes the popup after a successful save.

Cancel behavior:

- Discards the current draft values.
- Keeps the previous saved values.
- Closes the popup.

---

## 13. Reward Wheel

### 13.1 Wheel Contents

The wheel contains rewards that are still available.

Rewards come from the runtime data derived from `Data.js` plus saved edit overrides.

Each available reward on the wheel has equal odds.

### 13.2 Spin Flow

When the player spins the wheel:

```text
Click Spin
↓
Coins deducted
↓
Wheel animates
↓
Reward selected
↓
Reward added to inventory
↓
Reward removed from wheel
↓
Reward removed from shop buy list
```

If the player does not have enough coins:

- Spin is disabled.
- No coins are deducted.

### 13.3 Reward Name and Value Consistency

If a reward is edited and saved, the updated reward name and value should be reflected consistently in:

- Wheel.
- Shop Buy tab.
- Shop Sell tab.
- Owned reward inventory.
- Any spin result display.

---

## 14. Shop

### 14.1 Shop Tabs

The Shop has two tabs:

- Buy.
- Sell.

Buy tab is selected by default.

### 14.2 Buy Tab

The Buy tab shows rewards that:

- Are still available.
- Have not been won from the wheel.
- Have not been bought.
- Have not been sold.

Each Buy reward shows:

- Reward name.
- Coin cost.
- Buy button.

If the player has enough coins:

- Buy button is enabled.

If the player does not have enough coins:

- Buy button is disabled.

### 14.3 Sell Tab

The Sell tab shows rewards currently owned by the player.

Each Sell reward shows:

- Reward name.
- Sell value.
- Sell button.

Selling a reward:

- Adds the sell value to the player's coin balance.
- Removes the reward from owned rewards.
- Permanently marks the reward as sold.
- Does not return the reward to the wheel or Buy tab.

---

## 15. Reward Edit Mode

### 15.1 Reward Edit Location

Reward editing happens in the existing Shop tab.

The Wheel tab remains focused on spinning.

No new dedicated Rewards tab is required.

### 15.2 Reward Edit Scope

Reward edit mode edits all rewards from the source data, not only currently available rewards.

This keeps reward names and values consistent for:

- Available rewards.
- Wheel rewards.
- Shop rewards.
- Owned rewards.
- Sold rewards.

### 15.3 Reward Edit Display

In reward edit mode, each reward has:

- Single-line text input for reward name.
- Dropdown for reward value.
- Save button.
- Cancel button.

Reward value dropdown options come from:

```text
gameData.rewardValueOptions
```

Gameplay mutation actions are disabled while edit mode is active.

### 15.4 Reward Edit Validation

Save is allowed only when:

- Reward name is not empty after trimming whitespace.
- Reward value is one of the configured reward value options.

Invalid saves should:

- Keep the reward editor visible.
- Show a clear validation error near the invalid input.
- Not update local storage.
- Not update the displayed saved value.

### 15.5 Reward Edit Save and Cancel

Save behavior:

- Saves one reward at a time.
- Trims reward name before saving.
- Writes the edit override to local storage.
- Updates all reward displays to use the saved values.

Cancel behavior:

- Discards the current draft values.
- Keeps the previous saved values.

---

## 16. Admin Removal

All admin-era logic must be removed.

Remove:

- `/admin` route.
- Home screen Admin button.
- Admin page client.
- Topic editor.
- Question editor.
- Reward editor.
- Admin unsaved changes guard.
- Arbitrary config save flow.
- Local-storage-backed admin config as the runtime source of truth.
- Add/delete/reorder workflows.
- Tests that only verify admin behavior.

Keep or replace only the validation and storage logic needed for:

- Static `Data.js` data validation.
- Edit-mode local storage overrides.

If local storage code is reused, it should be renamed so it describes edit overrides rather than admin configuration.

---

## 17. Game End Conditions

The game can end when no meaningful player actions remain.

Examples:

- All questions are answered.
- No available rewards remain.
- The player cannot spin.
- The player cannot buy.
- The player has no owned rewards to sell.

The game should show a clear Game Over state when no meaningful actions remain.

Edit mode should not be treated as a gameplay action for game-over calculation.

---

## 18. Technical Refactor Plan

### Phase 1: Data Consolidation

1. Create `src/features/config/Data.js`.
2. Move current topics and questions from `defaultQuestionsAndTopics.json` into `Data.js`.
3. Move current rewards from `defaultConfig.ts` into `Data.js`.
4. Add `rewardValueOptions` to `Data.js`.
5. Add a data adapter that maps `Data.js` into current runtime game types.
6. Add data validation for fixed board dimensions, coordinates, required text, and reward values.

Use an adapter first, then simplify runtime types after behavior is stable.

### Phase 2: Admin Removal

1. Remove `/admin`.
2. Remove the Home Admin button.
3. Remove admin editor components.
4. Remove admin configuration repository behavior.
5. Update Home and Game startup to load from the new data adapter.
6. Update or remove admin tests.

### Phase 3: Fixed Board Rendering

1. Replace dynamic topic count rendering with fixed 5-column rendering.
2. Replace dynamic value mapping as the core grid source with explicit cell data from `Data.js`.
3. Validate all coordinates before rendering.
4. Preserve current board visual style.
5. Preserve current question lifecycle behavior in play mode.
6. Keep power ups hidden on board cells.

### Phase 4: Query-Gated Edit Mode

1. Read `isEditable` from the URL query string on the game page.
2. Show the top-right edit-mode toggle only when `isEditable=true`.
3. Store active edit mode in client state.
4. Disable gameplay mutation actions while edit mode is active.
5. Ensure saved edits remain available after toggling edit mode off.

### Phase 5: Board Editing

1. Extend the question popup to support play mode and edit mode.
2. Keep reveal/correct/incorrect behavior in play mode.
3. Replace gameplay controls with question and answer inputs in edit mode.
4. Validate non-empty question and answer text before save.
5. Save one board cell override at a time.
6. Cancel without changing saved values.
7. Do not expose power-up configuration in edit mode.

### Phase 6: Reward Editing

1. Add reward editing to the existing Shop tab.
2. Show all rewards from the runtime data in reward edit mode.
3. Support draft reward name and draft reward value.
4. Validate non-empty reward name and valid reward value before save.
5. Save one reward override at a time.
6. Cancel without changing saved values.

### Phase 7: Cell Power Ups

1. Extend `Data.js` cell parsing and validation to support one optional `powerUp`.
2. Reject unsupported power-up types.
3. Reveal configured power ups in the question modal only after the cell is selected.
4. Add runtime state for `correctStreakCount`, `isStreakMultiplierActive`, and `isSellingLocked`.
5. Apply normal question scoring before power-up coin effects.
6. Apply global streak multiplier rules for consecutive correct answers.
7. Apply selling lock rules for `DISABLE_SELLING_ON_INCORRECT`.
8. Reset power-up runtime state on New Game.

### Phase 8: Tests and Verification

1. Update unit tests for data validation and game initialization.
2. Remove or rewrite Admin tests.
3. Add tests for fixed 5 by 4 board validation.
4. Add tests for query-gated edit toggle visibility.
5. Add tests for board edit save validation.
6. Add tests for board edit cancel behavior.
7. Add tests for reward edit save validation.
8. Add tests for reward edit cancel behavior.
9. Add tests that saved edits appear in gameplay views.
10. Add tests for valid and invalid power-up config.
11. Add tests for modal power-up reveal timing.
12. Add tests for double balance, halve balance, Mystery Gift, bonus 10, streak multiplier, and selling lock behavior.
13. Update e2e flow to start a game without Admin dependency.
14. Run typecheck, lint, unit tests, e2e tests, and production build.

---

## 19. Acceptance Criteria

The refactor is complete when:

- The app has no Admin route.
- The Home screen has no Admin button.
- Game data is loaded from `src/features/config/Data.js`.
- Runtime startup does not depend on arbitrary admin-created local storage config.
- Local storage is used only for edit-mode overrides.
- The board always renders exactly 5 columns and 4 rows.
- Every board card is populated from the data source.
- Board values remain `5`, `10`, `15`, and `20`.
- Topic names are not editable.
- Users cannot add or delete topics, board cells, questions, or rewards.
- The edit-mode toggle appears only for `/game?isEditable=true`.
- Gameplay mutation actions are disabled while edit mode is active.
- Board edit mode supports non-empty question and answer edits.
- Reward edit mode is available in the existing Shop tab.
- Reward edit mode supports non-empty reward name and valid reward value edits.
- Save applies to one board cell or one reward at a time.
- Cancel discards unsaved board and reward edits.
- Saved board and reward edits are reflected wherever that data appears.
- Tests cover fixed board data, admin removal, data source loading, query-gated edit mode, validation, Save, and Cancel behavior.
- `Data.js` supports one optional power up per board cell.
- Unsupported power-up types are rejected by validation.
- Power ups are hidden on the board and revealed in the question modal after selecting the cell.
- Correct-triggered power ups apply after normal question scoring.
- `HALVE_BALANCE_ON_INCORRECT` rounds up when halving coins.
- `MYSTERY_GIFT` shows a message only and does not mutate coins, rewards, inventory, shop, or wheel state.
- `BONUS_ON_CORRECT` awards 10 bonus coins only on Correct answers.
- The third consecutive Correct answer activates and receives the 2x streak multiplier.
- Incorrect answers reset streak state and disable the streak multiplier.
- `DISABLE_SELLING_ON_INCORRECT` disables selling only after that configured cell is answered Incorrect.
- Selling lock clears on the next Correct answer.
- New Game resets `correctStreakCount`, `isStreakMultiplierActive`, and `isSellingLocked`.
