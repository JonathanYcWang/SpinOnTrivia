import type { WheelSegment } from "./wheelSegments";

const SPENT_SEGMENT = { fill: "#1f2937", text: "#1f2937" };
const REWARD_SEGMENTS = [{ fill: "#E897A4" }, { fill: "#F4D7D4" }] as const;

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number,
) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function segmentPath(index: number, total: number) {
  const startAngle = (index * 360) / total;
  const endAngle = ((index + 1) * 360) / total;
  const start = polarToCartesian(100, 100, 96, endAngle);
  const end = polarToCartesian(100, 100, 96, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M 100 100 L ${start.x} ${start.y} A 96 96 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

function getSegmentMiddleAngle(index: number, total: number) {
  return (index * 360) / total + 180 / total;
}

function getRadialTextRotation(angleDeg: number) {
  return angleDeg - 90;
}

function truncateWheelLabel(label: string, maxLength: number) {
  return label.length > maxLength
    ? `${label.slice(0, maxLength - 3)}...`
    : label;
}

export function RewardWheel({
  segments,
  spentRewardIds,
  rotationDeg,
  onTransitionEnd,
  onSpin,
  canSpin,
}: {
  segments: WheelSegment[];
  spentRewardIds: string[];
  rotationDeg: number;
  onTransitionEnd(): void;
  onSpin(): void;
  canSpin: boolean;
}) {
  if (segments.length === 0) return null;
  const spentSet = new Set(spentRewardIds);
  return (
    <div className="relative mx-auto aspect-square w-full max-w-xl">
      <div className="absolute left-1/2 top-0 z-10 h-0 w-0 -translate-x-1/2 border-x-[12px] border-t-[22px] border-x-transparent border-t-[var(--foreground)]" />
      <svg
        aria-label="Reward wheel"
        className="h-full w-full drop-shadow-2xl transition-transform duration-[4000ms] ease-out"
        onTransitionEnd={onTransitionEnd}
        style={{ transform: `rotate(${rotationDeg}deg)` }}
        viewBox="0 0 200 200"
      >
        {segments.map((segment, index) => {
          const isSpent =
            segment.type === "REWARD" && spentSet.has(segment.reward.id);
          const segmentStyle =
            segment.type === "REWARD" && !isSpent
              ? REWARD_SEGMENTS[index % REWARD_SEGMENTS.length]
              : SPENT_SEGMENT;
          const label =
            segment.type === "EMPTY"
              ? "Try Again"
              : isSpent
                ? null
                : segment.reward.name;
          return (
            <g key={segment.id}>
              <path
                d={segmentPath(index, segments.length)}
                fill={segmentStyle.fill}
                stroke="#1f2937"
                strokeWidth="1"
              />
              {label ? (
                <g
                  transform={`translate(100 100) rotate(${getRadialTextRotation(
                    getSegmentMiddleAngle(index, segments.length),
                  )}) translate(88 0) rotate(180)`}
                >
                  <text
                    dominantBaseline="middle"
                    fill="#ffffff"
                    fontSize={segments.length > 16 ? 5.5 : 7}
                    fontWeight="800"
                    paintOrder="stroke"
                    stroke="#111827"
                    strokeWidth="0.8"
                    textAnchor="start"
                    x="0"
                    y="0"
                  >
                    {truncateWheelLabel(label, segments.length > 16 ? 12 : 16)}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
        <circle cx="100" cy="100" fill="#ffffff" r="16" />
      </svg>
      <button
        aria-label="Spin the wheel"
        className="absolute left-1/2 top-1/2 z-10 flex h-[18%] w-[18%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[var(--foreground)] bg-white text-[10px] font-bold tracking-wider text-[var(--foreground)] shadow-md transition-colors duration-200 hover:bg-[var(--primary)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white disabled:hover:text-[var(--foreground)] sm:text-xs"
        disabled={!canSpin}
        onClick={onSpin}
        type="button"
      >
        SPIN
      </button>
    </div>
  );
}
