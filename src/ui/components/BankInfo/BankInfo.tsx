import { ScoreBox } from "@/ui/components/ScoreBox/ScoreBox";

export type BankInfoProps = {
  balance: number;
  className?: string;
};

export function BankInfo({ balance, className }: BankInfoProps) {
  const rootClassName = [
    "font-score inline-flex rounded-xl bg-ui-panel p-2 select-none",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClassName}>
      <ScoreBox variant="bank" value={balance} />
    </div>
  );
}
