import { Card } from "@/components/ui/Card";

const powerUps = [
  [
    "Double balance",
    "A correct answer doubles your total coins after question coins are awarded.",
  ],
  ["Halve balance", "An incorrect answer halves your total coins, rounded up."],
  ["Bonus coins", "A correct answer adds 20 extra coins."],
  [
    "Double spin cost",
    "An incorrect answer makes your next wheel spin cost 40 coins.",
  ],
  [
    "Half spin cost",
    "A correct answer makes your next wheel spin cost 10 coins.",
  ],
] as const;

export function RulesTab() {
  return (
    <section className="space-y-5" aria-labelledby="rules-title">
      <div>
        <h1 className="text-3xl font-bold" id="rules-title">
          How to Play
        </h1>
        <p className="mt-2 text-[var(--text-muted)]">
          Answer questions, build your coin balance, and use it to win or buy
          rewards.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RuleCard title="1. Play the board">
          <ul className="list-disc space-y-2 pl-5">
            <li>Select an available question and reveal its answer.</li>
            <li>A correct answer awards the coins shown on the card.</li>
            <li>
              An incorrect answer awards no coins and does not deduct coins.
            </li>
            <li>Each question can be answered only once.</li>
          </ul>
        </RuleCard>

        <RuleCard title="2. Build a streak">
          <p>
            Three correct answers in a row activate the streak bonus. The third
            correct answer gets a 5-coin bonus, and the bonus grows by 5 coins
            after every five correct answers. An incorrect answer resets the
            streak.
          </p>
        </RuleCard>

        <RuleCard title="3. Special Cards">
          <p className="mb-3">
            A special card shows its effect when opened. The effect applies only
            when its correct or incorrect condition is met.
          </p>
          <dl className="space-y-3">
            {powerUps.map(([name, effect]) => (
              <div key={name}>
                <dt className="font-semibold">{name}</dt>
                <dd className="text-[var(--text-muted)]">{effect}</dd>
              </div>
            ))}
          </dl>
        </RuleCard>

        <RuleCard title="4. Spin the wheel">
          <ul className="list-disc space-y-2 pl-5">
            <li>A normal spin costs 20 coins.</li>
            <li>Spin-cost power-ups affect your next spin only.</li>
            <li>Landing on a reward adds it to your inventory.</li>
            <li>
              Landing on an empty or previously won segment awards nothing.
            </li>
          </ul>
        </RuleCard>

        <RuleCard title="5. Visit the shop">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Buy a reward for its listed price instead of spinning for it.
            </li>
            <li>Bought rewards are removed from both the shop and wheel.</li>
            <li>
              Sellable rewards sell for half their value, with a 10-coin
              minimum.
            </li>
            <li>Unsellable rewards cannot be sold.</li>
          </ul>
        </RuleCard>
      </div>
    </section>
  );
}

function RuleCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="leading-7 text-[var(--foreground)]">{children}</div>
    </Card>
  );
}
