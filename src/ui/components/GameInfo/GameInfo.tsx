import { BankInfo } from "@/ui/components/BankInfo/BankInfo";
import { HandInfo, type HandInfoProps } from "@/ui/components/HandInfo/HandInfo";
import {
  InfoBox,
  InfoBoxAnteValue,
  InfoBoxRockValue,
} from "@/ui/components/InfoBox/InfoBox";
import { RoundInfo, type RoundInfoProps } from "@/ui/components/RoundInfo/RoundInfo";
import { RoundScore } from "@/ui/components/RoundScore/RoundScore";

export type GameInfoDisplayMode = "portrait" | "landscape";

export type GameInfoStats = {
  hands: number;
  discards: number;
  anteCurrent: number;
  anteTotal: number;
  round: number;
};

export type GameInfoProps = {
  displayMode: GameInfoDisplayMode;
  roundInfo: Omit<RoundInfoProps, "className">;
  roundScore: number;
  handInfo: Omit<HandInfoProps, "className">;
  stats: GameInfoStats;
  balance: number;
  onRunInfoClick?: () => void;
  onOptionsClick?: () => void;
  className?: string;
};

type GameInfoActionButtonProps = {
  label: string;
  tone: "runInfo" | "options";
  onClick?: () => void;
  className?: string;
};

const actionToneClass: Record<GameInfoActionButtonProps["tone"], string> = {
  runInfo: "bg-red-600 hover:bg-red-500",
  options: "bg-orange-500 hover:bg-orange-400",
};

function GameInfoActionButton({
  label,
  tone,
  onClick,
  className,
}: GameInfoActionButtonProps) {
  const buttonClassName = [
    "font-score flex min-h-14 w-full cursor-pointer items-center justify-center rounded-xl border-b-3 border-black/30 px-3 py-2 text-xl leading-none font-bold text-white select-none",
    actionToneClass[tone],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={buttonClassName} onClick={onClick}>
      {label}
    </button>
  );
}

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
    "flex min-w-0 gap-2",
    direction === "row" ? "flex-row" : "flex-col",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClassName}>
      <GameInfoActionButton label="Run Info" tone="runInfo" onClick={onRunInfoClick} />
      <GameInfoActionButton label="Options" tone="options" onClick={onOptionsClick} />
    </div>
  );
}


function GameInfoPortraitStats({ stats, balance }: { stats: GameInfoStats; balance: number }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <InfoBox label="Hands">
          <InfoBoxRockValue tone="blue" value={stats.hands} />
        </InfoBox>
        <InfoBox label="Discards">
          <InfoBoxRockValue tone="red" value={stats.discards} />
        </InfoBox>
      </div>

      <BankInfo balance={balance} className="w-full" fill />

      <div className="flex gap-2">
        <InfoBox label="Ante">
          <InfoBoxAnteValue current={stats.anteCurrent} total={stats.anteTotal} />
        </InfoBox>
        <InfoBox label="Round">
          <InfoBoxRockValue tone="amber" value={stats.round} />
        </InfoBox>
      </div>
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
      <div className="flex flex-col gap-2">
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
    <div className="flex w-[calc(18rem*2+0.5rem)] max-w-full gap-2">


      <InfoBox label="Hands">
        <InfoBoxRockValue tone="blue" value={stats.hands} />
      </InfoBox>
      <InfoBox label="Discards">
        <InfoBoxRockValue tone="red" value={stats.discards} />
      </InfoBox>

      <BankInfo balance={balance} className="min-w-0 flex-[1.6]" fill />

      <InfoBox label="Ante">
        <InfoBoxAnteValue current={stats.anteCurrent} total={stats.anteTotal} />
      </InfoBox>
      <InfoBox label="Round">
        <InfoBoxRockValue tone="amber" value={stats.round} />
      </InfoBox>

      <GameInfoActionButtons
        className="w-[5.5rem] shrink-0"
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
  const rootClassName = [
    "font-score flex select-none flex-col gap-2",
    displayMode === "portrait" ? "w-72 max-w-full" : "w-[calc(18rem*2+0.5rem)] max-w-full",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (displayMode === "portrait") {
    return (
      <section className={rootClassName} aria-label="Game information">
        <RoundInfo {...roundInfo} />
        <RoundScore score={roundScore} />
        <HandInfo {...handInfo} />
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

  return (
    <section className={rootClassName} aria-label="Game information">
      <div className="grid grid-cols-2 gap-2">
        <RoundInfo {...roundInfo} segment="header" className="min-h-0" />
        <RoundScore score={roundScore} className="h-full w-full max-w-none min-h-0" />
        <RoundInfo {...roundInfo} segment="body" className="min-h-0" />
        <HandInfo {...handInfo} className="h-full w-full max-w-none min-h-0 flex-col justify-between" />
      </div>

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
