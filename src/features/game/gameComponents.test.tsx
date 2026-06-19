import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/ToastProvider";
import gameData from "@/features/config/game-data.json";
import type { EditableGameData } from "@/features/config/editableGameData";
import { GameProvider } from "./GameProvider";
import { GamePageClient } from "./GamePageClient";
import { BoardTab } from "./board/BoardTab";
import { ShopTab } from "./shop/ShopTab";
import { validConfig } from "@/test/fixtures/configs";
import type {
  GameConfig,
  PowerUpType,
  RewardCoinValue,
} from "@/features/config/configTypes";

function renderGame(
  children: React.ReactNode,
  options: {
    isEditMode?: boolean;
    saveQuestionEdit?: (
      questionId: string,
      question: string,
      answer: string,
      powerUpType: PowerUpType | null,
    ) => void;
    saveRewardEdit?: (
      rewardId: string,
      name: string,
      value: RewardCoinValue,
    ) => void;
    saveRewardEdits?: (
      rewards: Array<{
        rewardId: string;
        name: string;
        value: RewardCoinValue;
        type: "SELLABLE" | "UNSELLABLE";
      }>,
    ) => void;
    deleteReward?: (rewardId: string) => void;
    config?: GameConfig;
  } = {},
) {
  return render(
    <ToastProvider>
      <GameProvider
        config={options.config ?? validConfig}
        isEditMode={options.isEditMode}
        saveQuestionEdit={options.saveQuestionEdit}
        saveRewardEdit={options.saveRewardEdit}
        saveRewardEdits={options.saveRewardEdits}
        deleteReward={options.deleteReward}
      >
        {children}
      </GameProvider>
    </ToastProvider>,
  );
}

describe("game components", () => {
  it("opens a Rules tab with the current game instructions", async () => {
    render(
      <ToastProvider>
        <GamePageClient
          initialEditMode={false}
          initialGameDataResult={{
            valid: true,
            data: gameData as EditableGameData,
          }}
        />
      </ToastProvider>,
    );

    await userEvent.click(screen.getByRole("tab", { name: "Rules" }));

    expect(
      screen.getByRole("heading", { name: "How to Play" }),
    ).toBeInTheDocument();
    expect(screen.getByText("A normal spin costs 20 coins.")).toBeInTheDocument();
    expect(screen.getByText("Double balance")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Rules" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("renders columns in configured order", () => {
    renderGame(<BoardTab />);
    const headings = screen.getAllByText(/History|Food/);
    expect(headings[0]).toHaveTextContent("History");
    expect(headings[1]).toHaveTextContent("Food");
  });

  it("question modal cannot be dismissed by Escape and reveal shows question and answer", async () => {
    renderGame(<BoardTab />);
    await userEvent.click(
      screen.getAllByRole("button", { name: "20 coins" })[0],
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Reveal Answer" }),
    );
    expect(screen.getByRole("button", { name: "Correct" })).toHaveClass(
      "bg-[var(--success)]",
    );
    expect(screen.getByRole("button", { name: "Incorrect" })).toHaveClass(
      "bg-[var(--secondary)]",
    );
    expect(screen.getByText("Capital of Canada?")).toBeInTheDocument();
    expect(screen.getByText("Ottawa")).toBeInTheDocument();
  });

  it("disables gameplay tabs while the wheel is spinning", async () => {
    render(
      <ToastProvider>
        <GamePageClient
          initialEditMode={false}
          initialGameDataResult={{
            valid: true,
            data: gameData as EditableGameData,
          }}
        />
      </ToastProvider>,
    );
    await userEvent.click(
      screen.getAllByRole("button", { name: "20 coins" })[0],
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Reveal Answer" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Correct" }));
    await userEvent.click(screen.getByRole("tab", { name: "Wheel" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Spin the wheel" }),
    );

    expect(screen.getByRole("tab", { name: "Board" })).toBeDisabled();
    expect(screen.getByRole("tab", { name: "Wheel" })).toBeDisabled();
    expect(screen.getByRole("tab", { name: "Shop" })).toBeDisabled();
    expect(screen.getByRole("tab", { name: "Rules" })).toBeDisabled();
  });

  it("shows non-mystery power-up copy when a powered card first opens", async () => {
    const config: GameConfig = {
      ...validConfig,
      questions: validConfig.questions.map((question) =>
        question.id === "question-history-20"
          ? { ...question, powerUp: { type: "DOUBLE_BALANCE_ON_CORRECT" } }
          : question,
      ),
    };
    renderGame(<BoardTab />, { config });

    await userEvent.click(
      screen.getAllByRole("button", { name: "20 coins" })[0],
    );
    expect(screen.getByText("Power Up:")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveClass("text-[1.225rem]");
  });

  it("applies double-balance power-up to the total after correct-answer coins", async () => {
    const config: GameConfig = {
      ...validConfig,
      questions: validConfig.questions.map((question) =>
        question.id === "question-history-20"
          ? { ...question, powerUp: { type: "DOUBLE_BALANCE_ON_CORRECT" } }
          : question,
      ),
    };
    renderGame(<BoardTab />, { config });

    await userEvent.click(
      screen.getAllByRole("button", { name: "20 coins" })[0],
    );
    await userEvent.click(screen.getByRole("button", { name: "Reveal Answer" }));
    await userEvent.click(screen.getByRole("button", { name: "Correct" }));

    expect(screen.getByLabelText("40 coins")).toBeInTheDocument();
  });

  it("applies halve-balance power-up to the unchanged total after an incorrect answer", async () => {
    const config: GameConfig = {
      ...validConfig,
      questions: validConfig.questions.map((question) =>
        question.id === "question-food-5"
          ? { ...question, powerUp: { type: "HALVE_BALANCE_ON_INCORRECT" } }
          : question,
      ),
    };
    renderGame(<BoardTab />, { config });

    await userEvent.click(
      screen.getAllByRole("button", { name: "20 coins" })[0],
    );
    await userEvent.click(screen.getByRole("button", { name: "Reveal Answer" }));
    await userEvent.click(screen.getByRole("button", { name: "Correct" }));
    await userEvent.click(
      screen.getAllByRole("button", { name: "20 coins" })[0],
    );
    await userEvent.click(screen.getByRole("button", { name: "Reveal Answer" }));
    await userEvent.click(screen.getByRole("button", { name: "Incorrect" }));

    expect(screen.getByLabelText("10 coins")).toBeInTheDocument();
  });

  it("correct and incorrect update board cells", async () => {
    renderGame(<BoardTab />);
    await userEvent.click(
      screen.getAllByRole("button", { name: "20 coins" })[0],
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Reveal Answer" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Correct" }));
    expect(
      screen.getByLabelText("Correct answer completed"),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getAllByRole("button", { name: "20 coins" })[0],
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Reveal Answer" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Incorrect" }));
    expect(
      screen.getByLabelText("Incorrect answer completed"),
    ).toBeInTheDocument();
  });

  it("shows the streak and next bonus when the correct streak bonus is active", async () => {
    const config: GameConfig = {
      ...validConfig,
      questions: [
        ...validConfig.questions,
        {
          id: "question-food-extra",
          topicId: "topic-food",
          coinValue: 20,
          coordinate: { x: 1, y: 2 },
          questionText: "Extra question?",
          answerText: "Extra answer",
        },
      ],
    };
    renderGame(<BoardTab />, { config });

    for (let index = 0; index < 2; index += 1) {
      await userEvent.click(
        screen.getAllByRole("button", { name: "20 coins" })[0],
      );
      await userEvent.click(
        screen.getByRole("button", { name: "Reveal Answer" }),
      );
      await userEvent.click(screen.getByRole("button", { name: "Correct" }));
    }
    expect(screen.queryByText(/Correct Streak/)).not.toBeInTheDocument();

    await userEvent.click(
      screen.getAllByRole("button", { name: "20 coins" })[0],
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Reveal Answer" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Correct" }));

    const bonusMessage = screen.getByRole("status");
    expect(bonusMessage).toHaveTextContent("Correct Streak: 3");
    expect(bonusMessage).toHaveTextContent("Next bonus: +5 coins");
    expect(bonusMessage).toBeInTheDocument();
  });

  it("buy disables when unaffordable, then buy/sell confirmation updates inventory and coins", async () => {
    renderGame(
      <>
        <BoardTab />
        <ShopTab />
      </>,
    );
    expect(screen.getAllByRole("button", { name: "Buy" })[0]).toBeDisabled();
    await userEvent.click(
      screen.getAllByRole("button", { name: "20 coins" })[0],
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Reveal Answer" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Correct" }));
    await userEvent.click(
      screen.getAllByRole("button", { name: "20 coins" })[0],
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Reveal Answer" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Correct" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Buy" })[0]);
    await userEvent.click(screen.getByRole("tab", { name: "Sell" }));
    expect(screen.getByText("Sell Value:")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Sell" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("cannot be reclaimed");
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Cancel",
      }),
    );
    expect(screen.getByText("Sell Value:")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Sell" }));
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Sell" }),
    );
    expect(
      screen.getByText("You don't own any rewards yet."),
    ).toBeInTheDocument();
    expect(screen.getAllByLabelText("20 coins").length).toBeGreaterThan(0);
  });

  it("organizes buy rewards into price tiers", () => {
    const config: GameConfig = {
      ...validConfig,
      rewards: [
        validConfig.rewards[0],
        {
          id: "reward-silver",
          name: "Silver Prize",
          description: "",
          coinValue: 50,
          type: "SELLABLE",
        },
        {
          id: "reward-dinner",
          name: "Dinner",
          description: "",
          coinValue: 70,
          type: "SELLABLE",
        },
        {
          id: "reward-grand-prize",
          name: "Grand Prize",
          description: "",
          coinValue: 100,
          type: "SELLABLE",
        },
      ],
    };
    renderGame(<ShopTab />, { config });

    expect(screen.getByRole("heading", { name: "Bronze" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Silver" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Gold" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Platinum" }),
    ).toBeInTheDocument();
  });

  it("description Show More and Show Less are independent per card", async () => {
    const config = {
      ...validConfig,
      rewards: validConfig.rewards.map((reward) => ({
        ...reward,
        description:
          "This description is intentionally long so it needs preview expansion on the reward card for testing independence.",
      })),
    };
    render(
      <ToastProvider>
        <GameProvider config={config}>
          <ShopTab />
        </GameProvider>
      </ToastProvider>,
    );
    const showMoreButtons = screen.getAllByRole("button", {
      name: "Show More",
    });
    await userEvent.click(showMoreButtons[0]);
    expect(
      screen.getByRole("button", { name: "Show Less" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Show More" })).toHaveLength(
      1,
    );
  });

  it("board edit save validates and saves one question", async () => {
    const saveQuestionEdit = vi.fn();
    renderGame(<BoardTab />, { isEditMode: true, saveQuestionEdit });

    await userEvent.click(
      screen.getAllByRole("button", { name: "20 coins" })[0],
    );
    await userEvent.clear(screen.getByLabelText("Question"));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Question is required.")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Question"), "New question?");
    await userEvent.clear(screen.getByLabelText("Answer"));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Answer is required.")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Answer"), "New answer");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(saveQuestionEdit).toHaveBeenCalledWith(
      "question-history-20",
      "New question?",
      "New answer",
      null,
    );
  });

  it("board edit save can select a power up", async () => {
    const saveQuestionEdit = vi.fn();
    renderGame(<BoardTab />, { isEditMode: true, saveQuestionEdit });

    await userEvent.click(
      screen.getAllByRole("button", { name: "20 coins" })[0],
    );
    await userEvent.selectOptions(
      screen.getByLabelText("Power up"),
      "BONUS_ON_CORRECT",
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(saveQuestionEdit).toHaveBeenCalledWith(
      "question-history-20",
      "Capital of Canada?",
      "Ottawa",
      "BONUS_ON_CORRECT",
    );
  });

  it("board edit cancel discards without saving", async () => {
    const saveQuestionEdit = vi.fn();
    renderGame(<BoardTab />, { isEditMode: true, saveQuestionEdit });

    await userEvent.click(
      screen.getAllByRole("button", { name: "20 coins" })[0],
    );
    await userEvent.clear(screen.getByLabelText("Question"));
    await userEvent.type(screen.getByLabelText("Question"), "Draft");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(saveQuestionEdit).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("reward edit autosaves text changes after a debounce", async () => {
    const saveRewardEdit = vi.fn();
    renderGame(<ShopTab />, { isEditMode: true, saveRewardEdit });

    const nameInput = screen.getAllByLabelText("Reward name", {
      selector: "input",
    })[0];
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancel" }),
    ).not.toBeInTheDocument();

    await userEvent.clear(nameInput);
    expect(
      await screen.findByText("Reward name is required.", {}, { timeout: 1500 }),
    ).toBeInTheDocument();
    expect(saveRewardEdit).not.toHaveBeenCalled();

    await userEvent.type(nameInput, "Green Tea");
    expect(saveRewardEdit).not.toHaveBeenCalled();
    await waitFor(
      () =>
        expect(saveRewardEdit).toHaveBeenCalledWith(
          "reward-tea",
          "Green Tea",
          40,
          "SELLABLE",
        ),
      { timeout: 1500 },
    );
  });

  it("reward edit autosaves select changes immediately", async () => {
    const saveRewardEdit = vi.fn();
    renderGame(<ShopTab />, { isEditMode: true, saveRewardEdit });

    await userEvent.selectOptions(screen.getAllByLabelText("Reward value")[0], "50");
    expect(saveRewardEdit).toHaveBeenCalledWith(
      "reward-tea",
      "Tea",
      50,
      "SELLABLE",
    );

    await userEvent.selectOptions(
      screen.getAllByLabelText("Reward type")[0],
      "UNSELLABLE",
    );
    expect(saveRewardEdit).toHaveBeenCalledWith(
      "reward-tea",
      "Tea",
      50,
      "UNSELLABLE",
    );
  });

  it("reward edit delete removes a reward from the edit list", async () => {
    const deleteReward = vi.fn();
    renderGame(<ShopTab />, { isEditMode: true, deleteReward });

    await userEvent.click(screen.getByRole("button", { name: "Delete Tea" }));

    expect(deleteReward).toHaveBeenCalledWith("reward-tea");
    expect(screen.queryByDisplayValue("Tea")).not.toBeInTheDocument();
  });

  it("reward edit add button creates a placeholder reward", async () => {
    const addReward = vi.fn(() => ({
      id: "reward-added",
      name: "A Placeholder",
      description: "",
      coinValue: 30 as const,
      type: "SELLABLE" as const,
    }));
    render(
      <ToastProvider>
        <GameProvider addReward={addReward} config={validConfig} isEditMode>
          <ShopTab />
        </GameProvider>
      </ToastProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Add reward" }));
    expect(addReward).toHaveBeenCalledOnce();
  });
});
