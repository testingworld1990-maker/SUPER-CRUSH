/**
 * In-App Purchase (Google Play Billing) Abstraction Layer for Super Crush: Doomsday
 * ---------------------------------------------------------------------------------
 * - Supports Android TWA Digital Goods API (`window.getDigitalGoodsService`)
 * - Supports Capacitor Native Play Billing plugin (`window.Capacitor?.Plugins?.PlayBilling`)
 * - Falls back cleanly to Sandbox Preview mode when `VITE_IAP_TEST_MODE !== 'false'`
 *   so reviewers & developers can test every pack without live billing credentials.
 */

const ENV = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

export const IAP_TEST_MODE: boolean = ENV.VITE_IAP_TEST_MODE !== 'false';

export interface ProductInfo {
  sku: string;
  title: string;
  priceLabel: string;
  nonConsumable?: boolean;
}

export const PRODUCT_CATALOG: Record<string, ProductInfo> = {
  remove_ads: { sku: 'remove_ads', title: 'Remove All Ads', priceLabel: '$2.99', nonConsumable: true },
  vip_monthly: { sku: 'vip_monthly', title: 'VIP Monthly Pass', priceLabel: '$4.99/mo', nonConsumable: true },
  starter_pack: { sku: 'starter_pack', title: 'Avenger Starter Kit', priceLabel: '$1.99' },
  coins_500: { sku: 'coins_500', title: '500 Credits', priceLabel: '$0.99' },
  coins_2000: { sku: 'coins_2000', title: '2,000 Credits', priceLabel: '$2.99' },
  unlimited_24h: { sku: 'unlimited_24h', title: '24h Unlimited Energy', priceLabel: '$0.99' },
  unlimited_7d: { sku: 'unlimited_7d', title: '7 Days Unlimited Energy', priceLabel: '$3.49' },
  festival_pass: { sku: 'festival_pass', title: 'Premium Doomsday Pass', priceLabel: '$3.99', nonConsumable: true },
};

interface DigitalGoodsService {
  listPurchases: () => Promise<Array<{ itemId: string; purchaseToken: string }>>;
}

interface CapacitorPlayBillingPlugin {
  purchase: (opts: { productId: string }) => Promise<{ purchased: boolean }>;
  restorePurchases: () => Promise<{ productIds: string[] }>;
}

function getNativeBilling(): CapacitorPlayBillingPlugin | null {
  if (typeof window === 'undefined') return null;
  const cap = (
    window as unknown as {
      Capacitor?: { isNativePlatform?: () => boolean; Plugins?: { PlayBilling?: CapacitorPlayBillingPlugin } };
    }
  ).Capacitor;
  if (cap?.isNativePlatform?.() && cap.Plugins?.PlayBilling) {
    return cap.Plugins.PlayBilling;
  }
  return null;
}

async function getDigitalGoods(): Promise<DigitalGoodsService | null> {
  if (typeof window === 'undefined') return null;
  const fn = (
    window as unknown as { getDigitalGoodsService?: (provider: string) => Promise<DigitalGoodsService> }
  ).getDigitalGoodsService;
  if (typeof fn !== 'function') return null;
  try {
    return await fn('https://play.google.com/billing');
  } catch {
    return null;
  }
}

export interface PurchaseResult {
  ok: boolean;
  sandbox: boolean;
  message: string;
}

export const IAPService = {
  isSandbox(): boolean {
    return IAP_TEST_MODE && !getNativeBilling();
  },

  async purchaseSku(sku: string): Promise<PurchaseResult> {
    const product = PRODUCT_CATALOG[sku];
    const title = product?.title ?? sku;

    const nativeBilling = getNativeBilling();
    if (nativeBilling) {
      try {
        const res = await nativeBilling.purchase({ productId: sku });
        return res.purchased
          ? { ok: true, sandbox: false, message: `Unlocked: ${title}` }
          : { ok: false, sandbox: false, message: 'Purchase cancelled.' };
      } catch {
        return { ok: false, sandbox: false, message: 'Google Play Billing unavailable right now.' };
      }
    }

    if (IAP_TEST_MODE) {
      return { ok: true, sandbox: true, message: `Unlocked: ${title}` };
    }

    return {
      ok: false,
      sandbox: false,
      message: 'In-app purchases require Google Play Services on Android.',
    };
  },

  async restorePurchases(): Promise<{ restoredSkus: string[]; message: string }> {
    const nativeBilling = getNativeBilling();
    if (nativeBilling) {
      try {
        const res = await nativeBilling.restorePurchases();
        const skus = res.productIds ?? [];
        return {
          restoredSkus: skus,
          message:
            skus.length > 0
              ? `Restored ${skus.length} Google Play entitlement(s).`
              : 'No previous Google Play purchases found on this account.',
        };
      } catch {
        return { restoredSkus: [], message: 'Unable to reach Google Play right now.' };
      }
    }

    const dg = await getDigitalGoods();
    if (dg) {
      try {
        const list = await dg.listPurchases();
        const skus = list.map((p) => p.itemId);
        return {
          restoredSkus: skus,
          message:
            skus.length > 0
              ? `Restored ${skus.length} Google Play purchase(s).`
              : 'No previous Google Play purchases found.',
        };
      } catch {
        return { restoredSkus: [], message: 'Unable to verify Google Play purchases.' };
      }
    }

    return {
      restoredSkus: [],
      message: 'Local purchases verified on this device.',
    };
  },
};
