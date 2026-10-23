// ============================================================
// User Types & Local User Definition
// ============================================================

export interface UserRole {
  id: string;
  name: string;
}

export interface UserInfo {
  id: string;
  role: UserRole;
  fullname: string | null;
  full_name?: string | null;
  username?: string;
  email: string;
  phone_number: string | null;
  address: string | null;
  date_of_birth: string | null;
  avatar: string | null;
  avatar_url?: string | null;
  bio: string | null;
  level: number;
  eco_points: number;
  total_reports: number;
  total_events: number;
  total_trees: number;
  followers_count: number;
  follower_count?: number;
  following_count: number;
  is_verified: boolean;
  is_active?: boolean;
  is_staff: boolean;
  stats?: {
    totalReports: number;
    totalEvents: number;
    treesPlanted: number;
    followerCount: number;
    followingCount: number;
  };
}

export interface UserStats {
  totalReports: number;
  totalEvents: number;
  treesPlanted: number;
  ecoPoints: number;
  level: number;
  followerCount: number;
  followingCount: number;
  streakDays: number;
  rank: number;
}

export interface UserActivity {
  id: string;
  type: 'report' | 'event' | 'badge' | 'tree';
  title: string;
  time: string;
}

export interface UpdateUserPayload {
  fullname?: string;
  fullName?: string;
  username?: string;
  phone_number?: string;
  address?: string;
  date_of_birth?: string;
  avatar?: { uri: string; name: string; type: string } | string;
  avatarUrl?: string;
  bio?: string;
  eco_points?: number;
  level?: number;
  total_reports?: number;
}

export const LOCAL_CREDENTIALS = {
  email: 'admin@ecopick.vn',
  password: '123456',
};

export const LOCAL_USER: UserInfo = {
  id: 'user-admin-local-001',
  email: 'admin@ecopick.vn',
  fullname: 'EcoPick Admin',
  full_name: 'EcoPick Admin',
  username: 'admin_ecopick',
  phone_number: '0987654321',
  address: 'Quận 1, TP. Hồ Chí Minh',
  date_of_birth: '2000-01-01',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
  avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
  bio: 'Tình nguyện viên tích cực vì một Việt Nam xanh - sạch - đẹp 🌿',
  role: {
    id: 'role-admin',
    name: 'admin',
  },
  level: 5,
  eco_points: 1250,
  total_reports: 12,
  total_events: 8,
  total_trees: 25,
  followers_count: 142,
  follower_count: 142,
  following_count: 38,
  is_verified: true,
  is_active: true,
  is_staff: true,
  stats: {
    totalReports: 12,
    totalEvents: 8,
    treesPlanted: 25,
    followerCount: 142,
    followingCount: 38,
  },
};
