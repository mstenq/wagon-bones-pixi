import { ButtonElement } from "@/ui/components/Button/ButtonElement";
import { BankInfo } from "@/ui/components/BankInfo/BankInfo";
import { GameModifiers, type GameModifier } from "@/ui/components/GameInfo/GameModifiers";
import { ProfessionInfo, type ProfessionInfoProps } from "@/ui/components/GameInfo/ProfessionInfo";
import { HandInfo, type HandInfoProps } from "@/ui/components/HandInfo/HandInfo";
import { InfoBox, InfoBoxLegValue, InfoBoxRockValue } from "@/ui/components/InfoBox/InfoBox";
import { RoundInfo, type RoundInfoProps } from "@/ui/components/RoundInfo/RoundInfo";
import { RoundTitle, type RoundTitleProps } from "@/ui/components/RoundInfo/RoundTitle";
import { RoundScore } from "@/ui/components/RoundScore/RoundScore";
import { useMediaQuery } from "@/ui/hooks/useMediaQuery";

/** Phone-sized landscape only — wider landscape uses default component scale. */
const NARROW_LANDSCAPE_SIDEBAR_QUERY = "(orientation: landscape) and (max-width: 1023px)";

export type GameInfoDisplayMode = "portrait" | "landscape";

export type GameInfoStats = {
  hands: number;
  rerolls: number;
  legCurrent: number;
  legTotal: number;
  round: number;
};

export type GameInfoProps = {
  displayMode: GameInfoDisplayMode;
  roundInfo: Omit<RoundTitleProps & RoundInfoProps, "className">;
  roundScore: number;
  profession: Omit<ProfessionInfoProps, "className" | "compact">;
  modifiers: GameModifier[];
  handInfo: Omit<HandInfoProps, "className">;
  stats: GameInfoStats;
  balance: number;
  onRunInfoClick?: () => void;
  onOptionsClick?: () => void;
  className?: string;
};

type GameInfoProfessionModifiersRowProps = {
  profession: Omit<ProfessionInfoProps, "className" | "compact">;
  modifiers: GameModifier[];
  compact: boolean;
  className?: string;
};

function GameInfoProfessionModifiersRow({
  profession,
  modifiers,
  compact,
  className,
}: GameInfoProfessionModifiersRowProps) {
  return (
    <div
      className={[
        "flex w-full min-w-0 items-stretch gap-0.5 xl:gap-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ProfessionInfo {...profession} compact={compact} className="min-h-0 min-w-0 flex-1" />
      <GameModifiers modifiers={modifiers} compact={compact} className="min-h-0 min-w-0" />
    </div>
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
    "flex min-w-0 shrink-0 ",
    direction === "row"
      ? "pl-1 lg:pl-1.5 xl:pl-0 min-h-8 flex-row gap-1 lg:min-h-9 lg:gap-1.5 xl:min-h-[47px] xl:gap-2"
      : "flex-col gap-0.5 xl:gap-1",
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

function GameInfoPortraitStats({
  stats,
  balance,
  compact,
}: {
  stats: GameInfoStats;
  balance: number;
  compact: boolean;
}) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-0.5 lg:gap-1 xl:gap-2">
      <div className="grid w-full min-w-0 grid-cols-4 gap-0.5 lg:gap-1 xl:gap-2">
        <InfoBox label="Hands" compact className="text-blue-500">
          <InfoBoxRockValue value={stats.hands} compact />
        </InfoBox>
        <InfoBox label="Rerolls" compact className="text-red-500">
          <InfoBoxRockValue value={stats.rerolls} compact />
        </InfoBox>
        <InfoBox label="Leg" compact>
          <InfoBoxLegValue current={stats.legCurrent} total={stats.legTotal} compact />
        </InfoBox>
        <InfoBox label="Round" compact className="text-amber-500">
          <InfoBoxRockValue value={stats.round} compact />
        </InfoBox>
      </div>

      <BankInfo balance={balance} compact fill />
    </div>
  );
}

type GameInfoBottomGridProps = {
  displayMode: GameInfoDisplayMode;
  stats: GameInfoStats;
  balance: number;
  compact: boolean;
  onRunInfoClick?: () => void;
  onOptionsClick?: () => void;
};

function GameInfoBottomGrid({
  displayMode,
  stats,
  balance,
  compact,
  onRunInfoClick,
  onOptionsClick,
}: GameInfoBottomGridProps) {
  if (displayMode === "portrait") {
    return (
      <div className="flex flex-col gap-0.5 lg:gap-1 xl:gap-2">
        <GameInfoPortraitStats stats={stats} balance={balance} compact={compact} />
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

      <InfoBox label="Leg" className="h-full min-h-0 flex-1">
        <InfoBoxLegValue current={stats.legCurrent} total={stats.legTotal} />
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
  profession,
  modifiers,
  handInfo,
  stats,
  balance,
  onRunInfoClick,
  onOptionsClick,
  className,
}: GameInfoProps) {
  const { title, ...roundBody } = roundInfo;

  const isPortraitStack = displayMode === "portrait";
  const compact = useMediaQuery(NARROW_LANDSCAPE_SIDEBAR_QUERY);

  const rootClassName = [
    "font-body flex w-full min-w-0 select-none flex-col  px-1 lg:px-2 xl:p-5",
    compact ? "gap-1 py-1.5" : "gap-0.5 py-1 lg:gap-1 lg:py-1.5 xl:gap-2",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={rootClassName} aria-label="Game information">
      {isPortraitStack ? (
        <div className={compact ? "flex flex-col gap-1" : "contents"}>
          <RoundTitle title={title} compact={compact} />
          <GameInfoProfessionModifiersRow
            profession={profession}
            modifiers={modifiers}
            compact={compact}
          />
          <RoundInfo {...roundBody} compact={compact} />
          <RoundScore score={roundScore} compact={compact} />
          <HandInfo {...handInfo} compact={compact} />
        </div>
      ) : (
        <div className="grid min-h-0 min-w-0 grid-cols-2 grid-rows-[auto_auto_auto] items-stretch gap-0.5 xl:gap-2">
          <RoundTitle title={title} className="h-full min-h-0 min-w-0" />
          <RoundScore score={roundScore} compact className="h-full min-h-0 min-w-0" />
          <div className="col-span-full flex w-full min-w-0 items-stretch gap-0.5 xl:gap-2">
            <ProfessionInfo {...profession} compact className="min-h-0 min-w-0 flex-1" />
            <GameModifiers modifiers={modifiers} compact className="min-h-0 min-w-0 " />
          </div>
          <RoundInfo {...roundBody} className="h-full min-h-0" />
          <HandInfo {...handInfo} className="h-full min-h-0" />
        </div>
      )}

      <GameInfoBottomGrid
        displayMode={displayMode}
        stats={stats}
        balance={balance}
        compact={compact}
        onRunInfoClick={onRunInfoClick}
        onOptionsClick={onOptionsClick}
      />
    </section>
  );
}
