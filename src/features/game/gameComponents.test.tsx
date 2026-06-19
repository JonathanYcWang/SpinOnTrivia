import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { GameProvider } from "./GameProvider";
import { BoardTab } from "./board/BoardTab";
import { ShopTab } from "./shop/ShopTab";
import { validConfig } from "@/test/fixtures/configs";
import type {
  GameConfig,
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
      }>,
    ) => void;
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
      >
        {children}
      </GameProvider>
    </ToastProvider>,
  );
}

describe("game components", () => {
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
    expect(screen.getByText("Capital of Canada?")).toBeInTheDocument();
    expect(screen.getByText("Ottawa")).toBeInTheDocument();
  });

  it("discovers mystery gift only after answering the powered cell correctly", async () => {
    const config: GameConfig = {
      ...validConfig,
      questions: validConfig.questions.map((question) =>
        question.id === "question-history-20"
          ? { ...question, powerUp: { type: "MYSTERY_GIFT" } }
          : question,
      ),
    };
    renderGame(<BoardTab />, { config });

    expect(screen.queryByText("Mystery Gift:")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Mystery Gift Discovered 🎁"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("power-up-confetti")).not.toBeInTheDocument();
    await userEvent.click(
      screen.getAllByRole("button", { name: "20 coins" })[0],
    );
    expect(screen.queryByText("Mystery Gift:")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Mystery Gift Discovered 🎁"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("power-up-confetti")).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Reveal Answer" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Correct" }));
    expect(screen.getByText("Mystery Gift Discovered 🎁")).toBeInTheDocument();
    expect(screen.getByTestId("power-up-confetti")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Close Mystery Gift" }),
    );
    expect(
      screen.queryByText("Mystery Gift Discovered 🎁"),
    ).not.toBeInTheDocument();
  });

  it("does not show confetti when a non-mystery power-up card first opens", async () => {
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
    expect(screen.getByText("Double Balance:")).toBeInTheDocument();
    expect(screen.queryByTestId("power-up-confetti")).not.toBeInTheDocument();
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

  it("shows a pulsing board message when the correct streak bonus is active", async () => {
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
    expect(screen.queryByText(/\+10 streak bonus active/)).not.toBeInTheDocument();

    await userEvent.click(
      screen.getAllByRole("button", { name: "20 coins" })[0],
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Reveal Answer" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Correct" }));

    const bonusMessage = screen.getByText(
      "+10 streak bonus active - 3 correct streak",
    );
    expect(bonusMessage).toBeInTheDocument();
    expect(bonusMessage).toHaveClass("animate-pulse");
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
          id: "reward-dinner",
          name: "Dinner",
          description: "",
          coinValue: 70,
        },
        {
          id: "reward-grand-prize",
          name: "Grand Prize",
          description: "",
          coinValue: 100,
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

  it("reward edit save validates and saves one reward", async () => {
    const saveRewardEdits = vi.fn();
    renderGame(<ShopTab />, { isEditMode: true, saveRewardEdits });

    const nameInput = screen.getAllByLabelText("Reward name", {
      selector: "input",
    })[0];
    await userEvent.clear(nameInput);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Reward name is required.")).toBeInTheDocument();

    await userEvent.type(nameInput, "Green Tea");
    await userEvent.selectOptions(
      screen.getAllByLabelText("Reward value")[0],
      "50",
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(saveRewardEdits).toHaveBeenCalledWith(
      expect.arrayContaining([
        { rewardId: "reward-tea", name: "Green Tea", value: 50 },
      ]),
    );
  });

  it("reward edit cancel resets all draft reward changes", async () => {
    const saveRewardEdits = vi.fn();
    renderGame(<ShopTab />, { isEditMode: true, saveRewardEdits });

    const nameInput = screen.getAllByLabelText("Reward name", {
      selector: "input",
    })[0];
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Draft Tea");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(nameInput).toHaveValue("Tea");
    expect(saveRewardEdits).not.toHaveBeenCalled();
  });

  it("reward edit add button creates a Blind Box reward", async () => {
    const addReward = vi.fn(() => ({
      id: "reward-added",
      name: "Blind Box",
      description: "",
      coinValue: 60 as const,
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
