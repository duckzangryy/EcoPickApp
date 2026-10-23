import { ENDPOINTS } from '@/api/endpoints';
import api from '@/lib/axios';

// ============================================================
// Types
// ============================================================

export interface Badge {
  id: string;
  name: string;
  description?: string;
  icon_url: string;
  category?: string; // "event", etc.
  [key: string]: unknown;
}



export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  [key: string]: unknown;
  badge: Badge
}

export interface ExchangeItem {
  id: string;
  title: string;
  description?: string;
  points_cost: number;
  image_url?: string;
  sponsor?: string;
  category?: string;
  available_quantity?: number;
}

export interface Redemption {
  id: string;
  item_id: string;
  item_title: string;
  item_image_url?: string;
  sponsor: string;
  points_spent: number;
  code: string;
  status: string;
  created_at: string;
}

export interface RedeemResult {
  redemption: Redemption;
  newTotal: number;
}

export interface CreateBadgePayload {
  name: string;
  description: string;
  icon_url: string;
  category: string;
}

export interface AssignBadgePayload {
  user_id: string;
  badge_id: string;
}

// ============================================================
// Helper: normalize API response sang array hoặc object
// ============================================================
function extractArray<T>(raw: any, keys: string[] = []): T[] {
  if (Array.isArray(raw)) return raw as T[];
  const inner = raw?.data ?? raw;
  if (Array.isArray(inner)) return inner as T[];
  for (const k of keys) {
    if (inner && Array.isArray(inner[k])) return inner[k] as T[];
  }
  return [] as T[];
}

function extractObject<T>(raw: any): T {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const inner = raw?.data ?? raw;
    return inner as T;
  }
  return raw as T;
}

// ============================================================
// API Functions
// ============================================================

export const badgeService = {
  /** GET /api/badge/badges/ */
  getAll: async (params?: Record<string, unknown>): Promise<Badge[]> => {
    const { data } = await api.get(ENDPOINTS.BADGES.LIST, { params });
    return extractArray<Badge>(data, ['badges', 'results']);
  },

  /** GET /api/badge/badges/{id}/ */
  getById: async (id: string): Promise<Badge> => {
    const { data } = await api.get(ENDPOINTS.BADGES.BY_ID(id));
    return extractObject<Badge>(data);
  },

  /** POST /api/badge/badges/ (formdata) */
  create: async (payload: CreateBadgePayload): Promise<Badge> => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, value);
    });
    const { data } = await api.post(ENDPOINTS.BADGES.LIST, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return extractObject<Badge>(data);
  },

  /** DELETE /api/badge/badges/{id}/ */
  delete: async (id: string) => {
    const { data } = await api.delete(ENDPOINTS.BADGES.BY_ID(id));
    return data;
  },
};

export const userBadgeService = {
  /** GET /api/badge/user-badges/?user_id=xxx&badge_id=xxx */
  getAll: async (params?: Record<string, unknown>): Promise<UserBadge[]> => {
    const { data } = await api.get(ENDPOINTS.BADGES.USER_BADGES.LIST, { params });
    return extractArray<UserBadge>(data, ['user_badges', 'results']);
  },

  /** POST /api/badge/user-badges/ (formdata) */
  assign: async (payload: AssignBadgePayload): Promise<UserBadge> => {
    const formData = new FormData();
    formData.append('user_id', payload.user_id);
    formData.append('badge_id', payload.badge_id);
    const { data } = await api.post(ENDPOINTS.BADGES.USER_BADGES.LIST, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return extractObject<UserBadge>(data);
  },

  /** DELETE /api/badge/user-badges/{id}/ */
  remove: async (id: string) => {
    const { data } = await api.delete(ENDPOINTS.BADGES.USER_BADGES.BY_ID(id));
    return data;
  },
};

export const exchangeItemService = {
  /** GET /api/badge/exchange-items/ */
  getAll: async (params?: Record<string, unknown>): Promise<ExchangeItem[]> => {
    const { data } = await api.get(ENDPOINTS.BADGES.EXCHANGE_ITEMS.LIST, { params });
    return extractArray<ExchangeItem>(data, ['exchange_items', 'items', 'results']);
  },

  /** POST /api/badge/exchange-items/ */
  create: async (payload: Record<string, unknown>): Promise<ExchangeItem> => {
    const { data } = await api.post(ENDPOINTS.BADGES.EXCHANGE_ITEMS.LIST, payload);
    return extractObject<ExchangeItem>(data);
  },

  /** DELETE /api/badge/exchange-items/{id}/ */
  delete: async (id: string) => {
    const { data } = await api.delete(ENDPOINTS.BADGES.EXCHANGE_ITEMS.BY_ID(id));
    return data;
  },

  redeem: async (id: string): Promise<RedeemResult> => {
    const { data } = await api.post(ENDPOINTS.BADGES.EXCHANGE_ITEMS.REDEEM(id));
    const result = extractObject<any>(data);
    const redemption = result.redemption ?? result.data?.redemption;
    if (!redemption?.code) throw new Error('API đổi quà không trả mã nhận quà hợp lệ');
    return { redemption, newTotal: Number(result.newTotal ?? result.data?.newTotal ?? 0) };
  },

  getRedemptions: async (): Promise<Redemption[]> => {
    const { data } = await api.get(ENDPOINTS.BADGES.REDEMPTIONS.LIST);
    return extractArray<Redemption>(data, ['redemptions', 'results']);
  },
};
