import { ButtonElement } from "@/ui/components/Button/ButtonElement";
import { BankInfo } from "@/ui/components/BankInfo/BankInfo";
import { HandInfo, type HandInfoProps } from "@/ui/components/HandInfo/HandInfo";
import { InfoBox, InfoBoxAnteValue, InfoBoxRockValue } from "@/ui/components/InfoBox/InfoBox";
import { RoundInfo, type RoundInfoProps } from "@/ui/components/RoundInfo/RoundInfo";
import { RoundTitle, type RoundTitleProps } from "@/ui/components/RoundInfo/RoundTitle";
import { RoundScore } from "@/ui/components/RoundScore/RoundScore";

export type GameInfoDisplayMode = "portrait" | "landscape";

export type GameInfoStats = {
  hands: number;
  rerolls: number;
  anteCurrent: number;
  anteTotal: number;
  round: number;
};

export type GameInfoProps = {
  displayMode: GameInfoDisplayMode;
  roundInfo: Omit<RoundTitleProps & RoundInfoProps, "className">;
  roundScore: number;
  handInfo: Omit<HandInfoProps, "className">;
  stats: GameInfoStats;
  balance: number;
  onRunInfoClick?: () => void;
  onOptionsClick?: () => void;
  className?: string;
};

type GameInfoActionButtonsProps = {
  onRunInfoClick?: () => void;
  onOptionsClick?: () => void;
  className?: string;
  direction?: "row" | "column";
};

function GameInfoActionButtons({
  onRunInfoClick,
  onOptionsClick,
  className,
  direction = "column",
}: GameInfoActionButtonsProps) {
  const rootClassName = [
    "flex min-w-0 shrink-0 ",
    direction === "row" ? "pl-1.5 min-h-[47px] flex-row gap-1.5 xl:gap-2" : "flex-col gap-0.5 xl:gap-1",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClassName}>
      <ButtonElement variant="primary" label="Run Info" onClick={onRunInfoClick} fullWidth />
      <ButtonElement variant="neutral" label="Options" onClick={onOptionsClick} fullWidth />
    </div>
  );
}

function GameInfoPortraitStats({ stats, balance }: { stats: GameInfoStats; balance: number }) {
  return (
    <div className="grid w-full min-w-0 grid-cols-2 gap-0.5 xl:gap-2">
      <InfoBox label="Hands" className="text-blue-500">
        <InfoBoxRockValue value={stats.hands} />
      </InfoBox>
      <InfoBox label="Rerolls" className="text-red-500">
        <InfoBoxRockValue value={stats.rerolls} />
      </InfoBox>

      <BankInfo balance={balance} className="col-span-2" fill />

      <InfoBox label="Ante">
        <InfoBoxAnteValue current={stats.anteCurrent} total={stats.anteTotal} />
      </InfoBox>
      <InfoBox label="Round" className="text-amber-500">
        <InfoBoxRockValue value={stats.round} />
      </InfoBox>
    </div>
  );
}

type GameInfoBottomGridProps = {
  displayMode: GameInfoDisplayMode;
  stats: GameInfoStats;
  balance: number;
  onRunInfoClick?: () => void;
  onOptionsClick?: () => void;
};

function GameInfoBottomGrid({
  displayMode,
  stats,
  balance,
  onRunInfoClick,
  onOptionsClick,
}: GameInfoBottomGridProps) {
  if (displayMode === "portrait") {
    return (
      <div className="flex flex-col gap-0.5 xl:gap-2">
        <GameInfoPortraitStats stats={stats} balance={balance} />
        <GameInfoActionButtons
          direction="row"
          onRunInfoClick={onRunInfoClick}
          onOptionsClick={onOptionsClick}
        />
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 items-stretch gap-0.5 xl:gap-2">
      <InfoBox label="Hands" className="h-full min-h-0 flex-1 text-blue-500">
        <InfoBoxRockValue value={stats.hands} />
      </InfoBox>
      <InfoBox label="Rerolls" className="h-full min-h-0 flex-1 text-red-500">
        <InfoBoxRockValue value={stats.rerolls} />
      </InfoBox>

      <BankInfo balance={balance} className="h-full min-h-0" fill growInRow />

      <InfoBox label="Ante" className="h-full min-h-0 flex-1">
        <InfoBoxAnteValue current={stats.anteCurrent} total={stats.anteTotal} />
      </InfoBox>
      <InfoBox label="Round" className="h-full min-h-0 flex-1 text-amber-500">
        <InfoBoxRockValue value={stats.round} />
      </InfoBox>

      <GameInfoActionButtons
        direction="row"
        className="h-full min-h-0 shrink-0 justify-end"
        onRunInfoClick={onRunInfoClick}
        onOptionsClick={onOptionsClick}
      />
    </div>
  );
}

export function GameInfo({
  displayMode,
  roundInfo,
  roundScore,
  handInfo,
  stats,
  balance,
  onRunInfoClick,
  onOptionsClick,
  className,
}: GameInfoProps) {
  const { title, ...roundBody } = roundInfo;

  const rootClassName = [
    "font-body flex w-full min-w-0 select-none flex-col gap-0.5 bg-background px-2.5 py-2 xl:gap-2 xl:p-5",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={rootClassName} aria-label="Game information">
      {displayMode === "portrait" ? (
        <>
          <RoundTitle title={title} />
          <RoundInfo {...roundBody} />
          <RoundScore score={roundScore} />
          <HandInfo {...handInfo} />
        </>
      ) : (
        <div className="grid min-h-0 min-w-0 grid-cols-2 grid-rows-[auto_auto] items-stretch gap-0.5 xl:gap-2">
          <RoundTitle title={title} className="h-full min-h-0 min-w-0" />
          <RoundScore score={roundScore} compact className="h-full min-h-0 min-w-0" />
          <RoundInfo {...roundBody} className="h-full min-h-0" />
          <HandInfo {...handInfo} className="h-full min-h-0" />
        </div>
      )}

      <GameInfoBottomGrid
        displayMode={displayMode}
        stats={stats}
        balance={balance}
        onRunInfoClick={onRunInfoClick}
        onOptionsClick={onOptionsClick}
      />
    </section>
  );
}
