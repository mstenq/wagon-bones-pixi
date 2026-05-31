import { ScoreBox } from "@/ui/components/ScoreBox/ScoreBox";

export type BankInfoProps = {
  balance: number;
  /** Grow to fill a flex parent (e.g. GameInfo landscape bottom row). */
  fill?: boolean;
  className?: string;
};

export function BankInfo({ balance, fill = false, className }: BankInfoProps) {
  const rootClassName = [
    "font-score rounded-xl bg-ui-panel p-1.5 select-none md:p-2",
    fill ? "flex w-full min-w-0" : "inline-flex",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClassName}>
      <ScoreBox variant="bank" value={balance} fill={fill} />
    </div>
  );
}
