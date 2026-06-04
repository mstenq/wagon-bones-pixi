import { ButtonElement } from "@/ui/components/Button/ButtonElement";
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

const gameInfoBackgroundClass: Record<GameInfoDisplayMode, string> = {
  portrait: "game-info-bg-portrait",
  landscape: "game-info-bg-landscape",
};

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
    "flex min-w-0 shrink-0 gap-1 md:gap-2",
    direction === "row" ? "flex-row" : "flex-col",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClassName}>
      <ButtonElement variant="danger" label="Run Info" onClick={onRunInfoClick} fullWidth />
      <ButtonElement variant="warning" label="Options" onClick={onOptionsClick} fullWidth />
    </div>
  );
}

function GameInfoPortraitStats({ stats, balance }: { stats: GameInfoStats; balance: number }) {
  return (
    <div className="flex flex-col gap-1 md:gap-2">
      <div className="flex gap-1 md:gap-2">
        <InfoBox label="Hands">
          <InfoBoxRockValue tone="blue" value={stats.hands} />
        </InfoBox>
        <InfoBox label="Discards">
          <InfoBoxRockValue tone="red" value={stats.discards} />
        </InfoBox>
      </div>

      <BankInfo balance={balance} className="w-full" fill />

      <div className="flex gap-1 md:gap-2">
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
      <div className="flex flex-col gap-1 md:gap-2">
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
    <div className="flex w-full min-w-0 gap-1 md:gap-2">
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
    "font-score flex w-full min-w-0 select-none flex-col gap-1 p-5 md:gap-2",
    gameInfoBackgroundClass[displayMode],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={rootClassName} aria-label="Game information">
      {displayMode === "portrait" ? (
        <>
          <RoundInfo {...roundInfo} />
          <RoundScore score={roundScore} />
          <HandInfo {...handInfo} />
        </>
      ) : (
        <div className="grid min-w-0 grid-cols-2 gap-1 md:gap-2">
          <RoundInfo {...roundInfo} segment="header" className="min-h-0 min-w-0 w-full" />
          <RoundScore score={roundScore} className="h-full min-h-0 min-w-0 w-full max-w-none" />
          <RoundInfo {...roundInfo} segment="body" className="min-h-0 min-w-0 w-full" />
          <HandInfo
            {...handInfo}
            className="flex h-full min-h-0 min-w-0 w-full max-w-none flex-col justify-between"
          />
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
