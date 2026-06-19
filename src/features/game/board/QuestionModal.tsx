"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CoinDisplay } from "@/components/ui/CoinDisplay";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type {
  PowerUpType,
  QuestionConfig,
} from "@/features/config/configTypes";
import { POWER_UP_TYPES } from "@/features/config/configTypes";
import { getQuestionById, getTopicById } from "../gameSelectors";
import { useGame } from "../GameProvider";

export function QuestionModal() {
  const { config, state, isEditMode, saveQuestionEdit, dispatch } = useGame();
  const [revealedState, setRevealedState] = useState<{
    questionId: string | null;
    revealed: boolean;
  }>({
    questionId: null,
    revealed: false,
  });
  const dialogRef = useRef<HTMLDivElement>(null);
  const questionId = state.activeQuestionId;
  const question = questionId ? getQuestionById(config, questionId) : null;
  const topic = question ? getTopicById(config, question.topicId) : null;
  const isAnswerRevealed =
    revealedState.questionId === questionId && revealedState.revealed;

  useEffect(() => {
    if (!questionId) return;
    const focusable = dialogRef.current?.querySelector("input, button");
    if (focusable instanceof HTMLElement) focusable.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") event.preventDefault();
      if (event.key !== "Tab") return;
      const focusableElements = Array.from(
        dialogRef.current?.querySelectorAll("input, button") ?? [],
      ).filter((item): item is HTMLElement => item instanceof HTMLElement);
      if (focusableElements.length === 0) return;
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [question, questionId]);

  if (!question || !topic) return null;

  function markQuestion(result: "CORRECT" | "INCORRECT") {
    if (!question) return;
    dispatch({
      type: "MARK_QUESTION",
      questionId: question.id,
      result,
      config,
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 px-4 py-8">
      <div
        aria-modal="true"
        className="mx-auto w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl sm:p-8"
        ref={dialogRef}
        role="dialog"
      >
        <div className="space-y-6">
          <div className="space-y-2 text-base text-[var(--text-muted)]">
            <p>
              <span className="font-semibold text-[var(--foreground)]">
                Topic:
              </span>{" "}
              {topic.name}
            </p>
            <p>
              <span className="font-semibold text-[var(--foreground)]">
                Value:
              </span>{" "}
              <CoinDisplay value={question.coinValue} />
            </p>
            {!isEditMode && question.powerUp ? (
              <PowerUpBanner type={question.powerUp.type} />
            ) : null}
          </div>
          <div>
            <h2 className="text-lg font-semibold">Question:</h2>
            {isEditMode ? (
              <EditQuestionFields
                key={question.id}
                onCancel={() => dispatch({ type: "CLOSE_QUESTION" })}
                onSave={(nextQuestion, nextAnswer, nextPowerUpType) => {
                  saveQuestionEdit(
                    question.id,
                    nextQuestion,
                    nextAnswer,
                    nextPowerUpType,
                  );
                  dispatch({ type: "CLOSE_QUESTION" });
                }}
                question={question}
              />
            ) : (
              <p className="mt-2 whitespace-pre-wrap break-words text-xl leading-8 text-[var(--foreground)]">
                {question.questionText}
              </p>
            )}
          </div>
          {isEditMode ? null : isAnswerRevealed ? (
            <>
              <div>
                <h2 className="text-lg font-semibold">Answer:</h2>
                <p className="mt-2 whitespace-pre-wrap break-words text-xl leading-8 text-[var(--foreground)]">
                  {question.answerText}
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <Button onClick={() => markQuestion("INCORRECT")}>
                  Incorrect
                </Button>
                <Button
                  onClick={() => markQuestion("CORRECT")}
                  variant="success"
                >
                  Correct
                </Button>
              </div>
            </>
          ) : (
            <div className="flex justify-end">
              <Button
                onClick={() => setRevealedState({ questionId, revealed: true })}
                variant="primary"
              >
                Reveal Answer
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const powerUpCopy: Record<PowerUpType, { name: string; effect: string }> = {
  DOUBLE_BALANCE_ON_CORRECT: {
    name: "Power Up",
    effect: "Correct answer doubles your coins (including these ones).",
  },
  HALVE_BALANCE_ON_INCORRECT: {
    name: "Caution",
    effect: "Incorrect answer halves your current coins.",
  },
  BONUS_ON_CORRECT: {
    name: "Bonus",
    effect: "Correct answer adds 20 bonus coins.",
  },
  DOUBLE_SPIN_COST_ON_INCORRECT: {
    name: "Caution",
    effect: "Incorrect answer doubles the cost of your next wheel spin.",
  },
  HALVE_SPIN_COST_ON_CORRECT: {
    name: "Power Up",
    effect: "Correct answer halves the cost of your next wheel spin.",
  },
};

function PowerUpBanner({ type }: { type: PowerUpType }) {
  const copy = powerUpCopy[type];
  return (
    <div
      className="rounded-lg border border-[var(--primary)]/40 bg-[var(--primary)]/10 px-3 py-2 text-[1.225rem] leading-7 text-[var(--foreground)]"
      role="status"
    >
      <span className="font-semibold">{copy.name}:</span> {copy.effect}
    </div>
  );
}

function EditQuestionFields({
  question,
  onCancel,
  onSave,
}: {
  question: QuestionConfig;
  onCancel(): void;
  onSave(
    question: string,
    answer: string,
    powerUpType: PowerUpType | null,
  ): void;
}) {
  const [draft, setDraft] = useState({
    question: question.questionText,
    answer: question.answerText,
    powerUpType: question.powerUp?.type ?? "",
  });
  const [errors, setErrors] = useState({ question: "", answer: "" });

  function saveEdit() {
    const nextQuestion = draft.question.trim();
    const nextAnswer = draft.answer.trim();
    const nextErrors = {
      question: nextQuestion ? "" : "Question is required.",
      answer: nextAnswer ? "" : "Answer is required.",
    };
    setErrors(nextErrors);
    if (nextErrors.question || nextErrors.answer) return;
    onSave(
      nextQuestion,
      nextAnswer,
      draft.powerUpType ? (draft.powerUpType as PowerUpType) : null,
    );
  }

  return (
    <div className="space-y-4">
      <Field
        error={errors.question}
        id="question-edit-question"
        label="Question"
      >
        <Input
          id="question-edit-question"
          value={draft.question}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              question: event.target.value,
            }))
          }
        />
      </Field>
      <Field error={errors.answer} id="question-edit-answer" label="Answer">
        <Input
          id="question-edit-answer"
          value={draft.answer}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              answer: event.target.value,
            }))
          }
        />
      </Field>
      <Field id="question-edit-power-up" label="Power up">
        <Select
          id="question-edit-power-up"
          value={draft.powerUpType}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              powerUpType: event.target.value,
            }))
          }
        >
          <option value="">None</option>
          {POWER_UP_TYPES.map((type) => (
            <option key={type} value={type}>
              {powerUpCopy[type].name} - {powerUpCopy[type].effect}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex justify-end gap-3">
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={saveEdit} variant="primary">
          Save
        </Button>
      </div>
    </div>
  );
}
