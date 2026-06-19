import { getOrderedTopics } from "@/features/config/configSelectors";
import { getBoardCellStateByQuestion } from "../gameSelectors";
import { useGame } from "../GameProvider";
import { BoardCell } from "./BoardCell";

export function BoardGrid() {
  const { config, state, isEditMode, dispatch } = useGame();
  const topics = getOrderedTopics(config);
  if (topics.length === 0 || config.questions.length === 0)
    return <p className="text-[var(--text-muted)]">No questions available.</p>;

  return (
    <div className="max-w-full overflow-x-auto pb-4">
      <div className="grid auto-cols-[10rem] grid-flow-col gap-3">
        {topics.map((topic) => (
          <div className="space-y-3" key={topic.id}>
            <div
              className="grid h-14 w-full place-items-center truncate rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-3 text-center font-semibold text-[var(--secondary-foreground)]"
              title={topic.name}
            >
              {topic.name}
            </div>
            {config.questions
              .filter((question) => question.topicId === topic.id)
              .sort((a, b) => a.coordinate.y - b.coordinate.y)
              .map((question) => {
              const cell = getBoardCellStateByQuestion(state, question);
              return (
                <BoardCell
                  key={question.id}
                  isEditMode={isEditMode}
                  state={cell.runtimeState}
                  topicName={topic.name}
                  value={question.coinValue}
                  onOpen={() => {
                    if (cell.question)
                      dispatch({
                        type: "OPEN_QUESTION",
                        questionId: cell.question.id,
                        mode: isEditMode ? "EDIT" : "PLAY",
                      });
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
