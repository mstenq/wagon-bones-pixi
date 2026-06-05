import { formatRoundScore } from '@/ui/components/RoundInfo/roundInfoFormat';

export { formatRoundScore };

export function formatRewardLine(rewardAmount: number): string {
  if (!Number.isFinite(rewardAmount) || rewardAmount <= 0) {
    return 'No reward';
  }
  const count = Math.max(1, Math.floor(rewardAmount));
  return `Reward: ${'$'.repeat(count)}+`;
}
