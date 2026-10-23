
export const PARTICIPANT_AVATARS = [
  'https://i.pravatar.cc/100?u=p1',
  'https://i.pravatar.cc/100?u=p2',
  'https://i.pravatar.cc/100?u=p3',
  'https://i.pravatar.cc/100?u=p4',
];

export const CHAT_AVATAR = 'https://i.pravatar.cc/100?u=sarah';

/** Parse "DD/MM/YYYY HH:mm:ss" hoặc ISO; dùng giờ tường của sự kiện, không đổi theo thiết bị. */
export const parseEventDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const raw = String(value).trim();

  const vn = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (vn) {
    const [, d, m, y, h = '0', min = '0', sec = '0'] = vn;
    return new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), Number(sec));
  }

  // ISO (kèm hoặc không kèm Z/offset): lấy phần giờ tường của sự kiện
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (iso) {
    const [, y, m, d, h, min, sec = '0'] = iso;
    return new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), Number(sec));
  }

  const parsed = new Date(raw);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Ngày dạng DD-MM-YYYY. */
export const formatDate = (value?: string | null): string => {
  const date = parseEventDate(value);
  if (!date) return value ? String(value) : '';
  return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}`;
};

/** Giờ dạng HH:mm (24h). */
export const formatTime = (value?: string | null): string => {
  const date = parseEventDate(value);
  if (!date) return '';
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

export const formatEventType = (type: string | null | undefined): string => {
  if (!type) return '';
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export const parseEquipment = (
  equip: string | null | undefined,
): { name: string; status: 'BRING OWN' | 'PROVIDED' }[] => {
  if (!equip) return [];
  return equip
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name, i) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      status: i % 2 === 0 ? ('BRING OWN' as const) : ('PROVIDED' as const),
    }));
};
export default {
  PARTICIPANT_AVATARS,
  CHAT_AVATAR,
  formatDate,
}