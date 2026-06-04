import { NeoSurface } from "@/ui/components/NeoSurface/NeoSurface";
import { ScoreBox } from "@/ui/components/ScoreBox/ScoreBox";

export type BankInfoProps = {
  balance: number;
  /** Grow to fill a flex parent (e.g. GameInfo landscape bottom row). */
  fill?: boolean;
  /** Extra flex grow in a horizontal stats row (landscape). */
  growInRow?: boolean;
  className?: string;
};

export function BankInfo({
  balance,
  fill = false,
  growInRow = false,
  className,
}: BankInfoProps) {
  return (
    <NeoSurface
      fullWidth
      className={[
        "w-full min-w-0",
        growInRow ? "flex-[1.6]" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      faceClassName="flex h-full min-h-0 w-full min-w-0 p-1.5 md:p-3"
    >
      <ScoreBox variant="bank" value={balance} fill={fill} className="w-full" />
    </NeoSurface>
  );
}
