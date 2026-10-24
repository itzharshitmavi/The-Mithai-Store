// POS integration seam. Not required for v1. A future POS (or a small bridge script) can either
// POST to /api/pos/sync with a bearer POS_API_KEY, or implement this interface and be called from a cron.
export interface PosSale { externalId: string; variantId: string; qty: number; at: string }
export interface PosAdapter { fetchSalesSince(iso: string): Promise<PosSale[]> }
