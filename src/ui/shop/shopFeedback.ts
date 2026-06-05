import type { ShopBuyFailReason } from '@/game/store/actions/shopBuyActions';

const SHOP_BUY_FAIL_MESSAGES: Record<ShopBuyFailReason, string> = {
  cant_afford: 'Not enough money',
  no_space: 'No room',
  no_effect: 'Cannot purchase',
};

export function shopBuyFailMessage(reason: ShopBuyFailReason): string {
  return SHOP_BUY_FAIL_MESSAGES[reason];
}

export function shopConsumableFailMessage(failReason: string | undefined): string {
  if (failReason) {
    return failReason;
  }
  return 'Cannot use';
}
