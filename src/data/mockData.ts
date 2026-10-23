// ─── Types ──────────────────────────────────────────────────────────
export type SeverityLevel = 'light' | 'medium' | 'heavy' | 'extreme';

export type WasteType =
  | 'plastic'
  | 'metal'
  | 'organic'
  | 'paper'
  | 'construction'
  | 'hazardous'
  | 'other';

export type ReportStatus = 'reported' | 'in_progress' | 'cleaned';

export interface WasteReport {
  id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  wasteTypes: WasteType[];
  status: ReportStatus;
  /** Computed distance string, e.g. "1.2 km • ~4 phút" */
  distance: string;
  latitude: number;
  longitude: number;
  image: string;
  createdAt: string;
  upvotes: number;
  comments: number;
  reporterName: string;
}

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  severity: SeverityLevel;
  title: string;
}

// ─── Waste Type Config ──────────────────────────────────────────────
export interface WasteTypeConfig {
  key: WasteType;
  label: string;
  icon: string;
  color: string;
}

export const WASTE_TYPE_CONFIGS: WasteTypeConfig[] = [
  { key: 'plastic', label: 'Plastic', icon: 'water-outline', color: '#3B82F6' },
  { key: 'metal', label: 'Metal', icon: 'hardware-chip-outline', color: '#6B7280' },
  { key: 'organic', label: 'Organic', icon: 'leaf-outline', color: '#16A34A' },
  { key: 'paper', label: 'Paper', icon: 'newspaper-outline', color: '#D97706' },
  { key: 'construction', label: 'Construction', icon: 'construct-outline', color: '#9333EA' },
  { key: 'hazardous', label: 'Hazardous', icon: 'nuclear-outline', color: '#DC2626' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal', color: '#94A3B8' },
];

export function getWasteTypeConfig(type: WasteType): WasteTypeConfig {
  return (
    WASTE_TYPE_CONFIGS.find((c) => c.key === type) ?? {
      key: 'other',
      label: 'Other',
      icon: 'ellipsis-horizontal',
      color: '#94A3B8',
    }
  );
}

// ─── Status Config ──────────────────────────────────────────────────
export interface StatusConfig {
  key: ReportStatus;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const STATUS_CONFIGS: StatusConfig[] = [
  { key: 'reported', label: 'Reported', icon: 'megaphone-outline', color: '#F59E0B', bgColor: 'rgba(245,158,11,0.1)' },
  { key: 'in_progress', label: 'In Progress', icon: 'time-outline', color: '#3B82F6', bgColor: 'rgba(59,130,246,0.1)' },
  { key: 'cleaned', label: 'Cleaned', icon: 'checkmark-circle-outline', color: '#16A34A', bgColor: 'rgba(22,163,74,0.1)' },
];

export function getStatusConfig(status: ReportStatus): StatusConfig {
  return (
    STATUS_CONFIGS.find((c) => c.key === status) ?? STATUS_CONFIGS[0]
  );
}

// ─── Mock Reports ───────────────────────────────────────────────────
export const MOCK_REPORTS: WasteReport[] = [
  {
    id: '1',
    title: 'Khu vực Ngã Sáu Buôn Ma Thuột',
    description: 'Rác thải sinh hoạt gồm túi nhựa, vỏ ly nước ngọt và bao bì bên lề đường',
    severity: 'heavy',
    wasteTypes: ['plastic', 'organic', 'metal'],
    status: 'reported',
    distance: '',
    latitude: 12.6828,
    longitude: 108.0378,
    image: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=400',
    createdAt: '2026-10-04T09:15:00Z',
    upvotes: 23,
    comments: 5,
    reporterName: 'Minh Hoàng',
  },
  {
    id: '2',
    title: 'Ven Hồ Lắk, Huyện Lắk',
    description: 'Rác nhựa và bao nilon trôi dạt ven hồ sau mùa du lịch',
    severity: 'medium',
    wasteTypes: ['plastic', 'paper'],
    status: 'in_progress',
    distance: '',
    latitude: 12.4167,
    longitude: 108.1833,
    image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400',
    createdAt: '2026-10-04T10:30:00Z',
    upvotes: 15,
    comments: 3,
    reporterName: 'H’Hen Niê',
  },
  {
    id: '3',
    title: 'Đường vào Thác Dray Nur',
    description: 'Rác vứt bừa bãi hai bên lối mòn vào khu sinh thái',
    severity: 'light',
    wasteTypes: ['plastic'],
    status: 'reported',
    distance: '',
    latitude: 12.5333,
    longitude: 107.8833,
    image: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=400',
    createdAt: '2026-10-04T07:00:00Z',
    upvotes: 8,
    comments: 1,
    reporterName: 'Y Ban Êban',
  },
  {
    id: '4',
    title: 'Kênh Nhiêu Lộc - Thị Nghè',
    description: 'Ô nhiễm nghiêm trọng trên kênh — rác công nghiệp và hóa chất',
    severity: 'extreme',
    wasteTypes: ['hazardous', 'plastic', 'construction'],
    status: 'reported',
    distance: '',
    latitude: 10.785,
    longitude: 106.675,
    image: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=400',
    createdAt: '2026-03-28T11:45:00Z',
    upvotes: 56,
    comments: 12,
    reporterName: 'Tuấn Kiệt',
  },
  {
    id: '5',
    title: 'Chợ Bến Thành, Q.1',
    description: 'Rác thải nhẹ quanh khu chợ, chủ yếu bao bì và hộp xốp',
    severity: 'light',
    wasteTypes: ['plastic', 'paper', 'organic'],
    status: 'cleaned',
    distance: '',
    latitude: 10.7725,
    longitude: 106.698,
    image: 'https://images.unsplash.com/photo-1567393528677-d6adae7d4e0a?w=400',
    createdAt: '2026-03-30T06:20:00Z',
    upvotes: 34,
    comments: 7,
    reporterName: 'Phương Mai',
  },
  {
    id: '6',
    title: 'Kênh Tàu Hủ, Q.8',
    description: 'Rác thải công nghiệp đổ trộm ban đêm dọc bờ kênh',
    severity: 'heavy',
    wasteTypes: ['construction', 'metal', 'hazardous'],
    status: 'reported',
    distance: '',
    latitude: 10.748,
    longitude: 106.663,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400',
    createdAt: '2026-04-01T22:30:00Z',
    upvotes: 41,
    comments: 9,
    reporterName: 'Đức Huy',
  },
  {
    id: '7',
    title: 'Chợ Bình Tây, Q.6',
    description: 'Rác chợ tràn ra đường sau giờ buôn bán — rau củ hư, bao bì',
    severity: 'medium',
    wasteTypes: ['organic', 'plastic', 'paper'],
    status: 'in_progress',
    distance: '',
    latitude: 10.749,
    longitude: 106.647,
    image: 'https://images.unsplash.com/photo-1559523182-a284c3fb7cff?w=400',
    createdAt: '2026-04-02T18:00:00Z',
    upvotes: 19,
    comments: 4,
    reporterName: 'Bảo Ngọc',
  },
  {
    id: '8',
    title: 'Công viên Gia Định, Gò Vấp',
    description: 'Rác nhẹ rải rác trong công viên — chai nước, giấy gói, khẩu trang',
    severity: 'light',
    wasteTypes: ['plastic', 'paper'],
    status: 'reported',
    distance: '',
    latitude: 10.813,
    longitude: 106.683,
    image: 'https://images.unsplash.com/photo-1571048633107-4a2a45a33c69?w=400',
    createdAt: '2026-04-03T05:45:00Z',
    upvotes: 6,
    comments: 0,
    reporterName: 'Vân Khánh',
  },
  {
    id: '9',
    title: 'Khu vực Đa Phước, Bình Chánh',
    description: 'Bãi rác quá tải, ô nhiễm nặng — mùi hôi thối lan rộng 2km',
    severity: 'extreme',
    wasteTypes: ['organic', 'hazardous', 'plastic', 'construction'],
    status: 'reported',
    distance: '',
    latitude: 10.665,
    longitude: 106.61,
    image: 'https://images.unsplash.com/photo-1574263867928-1e33aa258a8a?w=400',
    createdAt: '2026-03-25T10:00:00Z',
    upvotes: 89,
    comments: 21,
    reporterName: 'Hữu Nghĩa',
  },
  {
    id: '10',
    title: 'Khu đô thị Thủ Thiêm, Q.2',
    description: 'Rác xây dựng vứt bỏ trên các lô đất trống đang quy hoạch',
    severity: 'medium',
    wasteTypes: ['construction', 'metal'],
    status: 'reported',
    distance: '',
    latitude: 10.787,
    longitude: 106.723,
    image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=400',
    createdAt: '2026-04-01T08:15:00Z',
    upvotes: 27,
    comments: 6,
    reporterName: 'Thanh Tùng',
  },
  {
    id: '11',
    title: 'Phố Bùi Viện, Q.1',
    description: 'Rác thải sau giờ kinh doanh đêm — ly nhựa, ống hút, vỏ lon bia',
    severity: 'heavy',
    wasteTypes: ['plastic', 'metal', 'other'],
    status: 'in_progress',
    distance: '',
    latitude: 10.768,
    longitude: 106.694,
    image: 'https://images.unsplash.com/photo-1503596476-1c12a8ba09a9?w=400',
    createdAt: '2026-04-03T02:00:00Z',
    upvotes: 45,
    comments: 8,
    reporterName: 'Quốc Bảo',
  },
  {
    id: '12',
    title: 'Công viên Lê Văn Tám, Q.1',
    description: 'Rác nhẹ quanh khu vực tập thể dục và sân chơi trẻ em',
    severity: 'light',
    wasteTypes: ['plastic', 'paper'],
    status: 'cleaned',
    distance: '',
    latitude: 10.787,
    longitude: 106.696,
    image: 'https://images.unsplash.com/photo-1567393528677-d6adae7d4e0a?w=400',
    createdAt: '2026-04-02T06:00:00Z',
    upvotes: 12,
    comments: 2,
    reporterName: 'Ánh Dương',
  },
  {
    id: '13',
    title: 'Cầu Kiệu, Phú Nhuận',
    description: 'Rác thải dưới gầm cầu — túi rác sinh hoạt và phế liệu',
    severity: 'heavy',
    wasteTypes: ['plastic', 'organic', 'other'],
    status: 'reported',
    distance: '',
    latitude: 10.792,
    longitude: 106.685,
    image: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=400',
    createdAt: '2026-04-02T20:15:00Z',
    upvotes: 31,
    comments: 5,
    reporterName: 'Minh Phú',
  },
  {
    id: '14',
    title: 'Hồ Con Rùa, Q.3',
    description: 'Rác nhẹ quanh hồ — chủ yếu ly cà phê take-away',
    severity: 'light',
    wasteTypes: ['plastic', 'paper'],
    status: 'reported',
    distance: '',
    latitude: 10.781,
    longitude: 106.692,
    image: 'https://images.unsplash.com/photo-1571048633107-4a2a45a33c69?w=400',
    createdAt: '2026-04-03T08:30:00Z',
    upvotes: 9,
    comments: 1,
    reporterName: 'Thùy Linh',
  },
  {
    id: '15',
    title: 'Suối Tiên - Quận 9',
    description: 'Rác thải du lịch — bao bì thực phẩm, chai nước, vé giấy',
    severity: 'medium',
    wasteTypes: ['plastic', 'paper', 'organic'],
    status: 'reported',
    distance: '',
    latitude: 10.867,
    longitude: 106.779,
    image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400',
    createdAt: '2026-03-31T15:00:00Z',
    upvotes: 17,
    comments: 3,
    reporterName: 'Nhật Linh',
  },
];

export const MAP_MARKERS: MapMarker[] = MOCK_REPORTS.map((r) => ({
  id: r.id,
  latitude: r.latitude,
  longitude: r.longitude,
  severity: r.severity,
  title: r.title,
}));

export const INITIAL_REGION = {
  latitude: 12.6828,
  longitude: 108.0378,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

export const SEVERITY_FILTERS: { key: SeverityLevel; label: string }[] = [
  { key: 'light', label: 'Light' },
  { key: 'medium', label: 'Medium' },
  { key: 'heavy', label: 'Heavy' },
  { key: 'extreme', label: 'Extreme' },
];

// ─── Events (unchanged) ────────────────────────────────────────────
export interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  latitude?: number;
  longitude?: number;
  participants: number;
  image: string;
  isOrganizer?: boolean;
  type?: string;
  description?: string;
  distance?: string;
  equipment?: { name: string; status: 'BRING OWN' | 'PROVIDED' }[];
  confirmedCount?: number;
}

export const MOCK_EVENTS: EventItem[] = [
  {
    id: '1',
    title: 'Community Forest Replanting',
    date: 'Oct 24, 2023',
    time: '10:00 AM',
    location: 'Community Forest',
    participants: 12,
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop',
    isOrganizer: true,
    type: 'Community Event',
    description: "Help us restore the natural beauty of the north bank. We'll be collecting plastic waste and clearing invasive ivy.",
    distance: '2.4 KM ROUTE',
    confirmedCount: 8,
    equipment: [
      { name: 'Work Gloves', status: 'BRING OWN' },
      { name: 'Waste Bags', status: 'PROVIDED' },
      { name: 'Water & Snacks', status: 'BRING OWN' },
    ],
  },
  {
    id: '2',
    title: 'Coastal Cleanup Drive',
    date: 'Oct 28, 2023',
    time: '08:30 AM',
    location: 'Coastal Beach',
    participants: 45,
    image: 'https://images.unsplash.com/photo-1618477461853-cf6ed80fbea5?w=800&auto=format&fit=crop',
  },
  {
    id: '3',
    title: 'Urban Recycling Workshop',
    date: 'Nov 02, 2023',
    time: '02:00 PM',
    location: 'City Center',
    participants: 8,
    image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop',
    isOrganizer: true,
  },
];
