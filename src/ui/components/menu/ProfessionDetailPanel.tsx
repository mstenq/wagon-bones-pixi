import { getProfessionById, type ProfessionDef } from '@/data/professions';
import { DIFFICULTIES, GAMEPLAY } from '@/game/Constants';
import { gameFacade } from '@/game/facade/gameFacade';
import { getDiceGroupDisplayLabel, groupDiceByVisualIdentity } from '@/game/diceGrouping';
import { getHighestDifficultyBeaten } from '@/game/UserStats';
import { NeoSurfacePrimaryHeader } from '@/ui/components/NeoSurface/NeoSurface';

export type ProfessionDetailPanelProps = {
  professionId: string | null;
};

function buildStartingDiceGroups(prof: ProfessionDef) {
  const specialtyCount = prof.startingDice.length;
  const standardCount = Math.max(0, GAMEPLAY.STARTING_DICE - specialtyCount);

  const previewDice = prof.startingDice.map((enhancement, i) =>
    gameFacade.meta.createPreviewDie({
      id: `prof_detail_${prof.id}_${i}`,
      enhancement,
      value: enhancement === 'stone' ? 0 : 6,
    }),
  );

  const groups = groupDiceByVisualIdentity(previewDice).map((g) => ({
    label: getDiceGroupDisplayLabel(g.representative, g.dice.length),
    isStandard: false,
  }));

  if (standardCount > 0) {
    const standardDie = gameFacade.meta.createPreviewDie({
      id: `prof_detail_${prof.id}_standard`,
      enhancement: null,
      value: 6,
    });
    groups.push({
      label: getDiceGroupDisplayLabel(standardDie, standardCount),
      isStandard: true,
    });
  }

  const summary =
    standardCount > 0
      ? `${specialtyCount} specialty · ${standardCount} standard (${GAMEPLAY.STARTING_DICE} total)`
      : `${specialtyCount} dice (${GAMEPLAY.STARTING_DICE} total)`;

  return { groups, summary };
}

export function ProfessionDetailPanel({ professionId }: ProfessionDetailPanelProps) {
  if (!professionId) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center p-6">
        <p className="font-header m-0 text-center text-lg text-ui-panel-muted">Select a profession</p>
      </div>
    );
  }

  const prof = getProfessionById(professionId);
  if (!prof) {
    return null;
  }

  const beaten = getHighestDifficultyBeaten(prof.id);
  const beatenDef = beaten > 0 ? DIFFICULTIES[beaten - 1] : undefined;
  const beatenLabel = beatenDef ? `${beatenDef.name} (${beaten})` : 'None';
  const { groups, summary } = buildStartingDiceGroups(prof);

  return (
    <NeoSurfacePrimaryHeader
      fullWidth
      className="h-full"
      header={
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-28 items-center justify-center rounded-lg border-3 border-black bg-white/20">
            <span className="font-header text-5xl">{prof.title.charAt(0)}</span>
          </div>
          <h2 className="m-0 text-2xl">{prof.title}</h2>
          <p className="font-body m-0 text-base opacity-90">{prof.name}</p>
        </div>
      }
      bodyClassName="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 text-black"
    >
      <p className="font-body m-0 text-center text-sm text-ui-panel-muted">{prof.description}</p>

      {prof.specialEquipment ? (
        <section className="flex flex-col gap-1">
          <h3 className="font-header m-0 text-sm">Equipment Synergy: {prof.specialEquipment.name}</h3>
          <p className="font-body m-0 text-sm text-ui-panel-muted">{prof.specialEquipment.effect}</p>
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <h3 className="font-header m-0 text-sm">Starting Dice</h3>
        <p className="font-body m-0 text-xs text-ui-panel-muted">{summary}</p>
        <ul className="font-body m-0 flex list-none flex-wrap justify-center gap-2 p-0">
          {groups.map((g) => (
            <li
              key={g.label}
              className={[
                'rounded-md border-2 border-black px-2 py-1 text-xs',
                g.isStandard ? 'bg-white text-ui-panel-muted' : 'bg-primary-50',
              ].join(' ')}
            >
              {g.label}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-1 text-center">
        <h3 className="font-header m-0 text-sm">Highest difficulty completed</h3>
        <p className="font-body m-0 text-sm">{beatenLabel}</p>
      </section>
    </NeoSurfacePrimaryHeader>
  );
}
