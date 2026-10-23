import { ENDPOINTS } from "@/api/endpoints";
import api from "@/lib/axios";

export interface SignInResponse {
  access_token: string;
  accessToken?: string;
  expires_in?: number;
  token_type?: string;
  refresh_token: string;
  refreshToken?: string;
  user?: UserInfo;
  data?: { user: UserInfo; accessToken: string; refreshToken: string };
}
export interface SignInPayload { email: string; password: string }
export interface SignUpPayload {
  email: string; password: string; fullName?: string; fullname?: string; username?: string; phone_number?: string; role?: string;
}
export type RegisterPayload = SignUpPayload;
export interface RegisterResponse {
  success: boolean; data?: { user: UserInfo; message: string; otp?: string };
  id?: string; email?: string; message?: string; otp?: string;
}
export interface VerifyEmailPayload { email: string; otp: string }
export interface ForgotPasswordPayload { email: string }
export interface ResetPasswordPayload { email: string; otp?: string; token?: string; newPassword?: string; password?: string }
export interface UserListItem {
  id: string; fullname: string | null; full_name?: string | null; username?: string; email: string;
  phone_number: string | null; address: string | null; date_of_birth: string | null; avatar: string | null;
  avatar_url?: string | null; role: { id: string; name: string };
}
export * from '@/types/user';
import { type UserInfo, type UpdateUserPayload, type UserStats, type UserActivity } from '@/types/user';

const unwrap = <T,>(response: any): T => (response?.data?.data ?? response?.data ?? response) as T;

export const authService = {
  signIn: async (payload: SignInPayload): Promise<SignInResponse> => {
    try {
      const { data } = await api.post<any>(ENDPOINTS.AUTH.LOGIN, payload);
      const source = data?.data ?? data;
      const token = source.accessToken || source.access_token;
      const refresh = source.refreshToken || source.refresh_token;
      if (!token || !refresh) throw new Error('API đăng nhập không trả access/refresh token hợp lệ');
      return { ...source, access_token: token, accessToken: token, refresh_token: refresh, refreshToken: refresh, user: source.user };
    } catch (error: any) {
      if (error?.response?.status !== 404 && error?.response?.status !== 405) throw error;
      const { data } = await api.post<SignInResponse>(ENDPOINTS.USERS.SIGN_IN, payload);
      return data;
    }
  },
  signUp: async (payload: SignUpPayload): Promise<RegisterResponse> => {
    try {
      const { data } = await api.post<RegisterResponse>(ENDPOINTS.AUTH.REGISTER, {
        email: payload.email, password: payload.password,
        fullName: payload.fullName || payload.fullname || payload.email.split('@')[0],
        username: payload.username || payload.email.split('@')[0], role: payload.role || 'user',
      });
      return data;
    } catch (error: any) {
      if (error?.response?.status !== 404 && error?.response?.status !== 405) throw error;
      const { data } = await api.post<RegisterResponse>(ENDPOINTS.USERS.SIGN_UP, payload);
      return data;
    }
  },
  verifyEmail: async (payload: VerifyEmailPayload) => unwrap(await api.post(ENDPOINTS.AUTH.VERIFY_EMAIL, payload)),
  forgotPassword: async (payload: ForgotPasswordPayload) => unwrap(await api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, payload)),
  resetPassword: async (payload: ResetPasswordPayload) => unwrap(await api.post(ENDPOINTS.AUTH.RESET_PASSWORD, payload)),
  refreshToken: async (token?: string) => unwrap(await api.post(ENDPOINTS.AUTH.REFRESH, { refreshToken: token })),
  logout: async () => { await api.post(ENDPOINTS.AUTH.LOGOUT); },
  googleLogin: async (token: string, email?: string, fullName?: string) => unwrap(await api.post(ENDPOINTS.AUTH.GOOGLE, { token, email, fullName })),
};

export const userService = {
  getUserInfo: async (): Promise<UserInfo> => {
    try {
      const { data } = await api.get<any>(ENDPOINTS.USERS.ME);
      const user = data?.data?.user ?? data?.data ?? data?.user ?? data;
      if (!user?.id) throw new Error('API không trả thông tin tài khoản');
      return user;
    } catch (error: any) {
      if (error?.response?.status !== 404 && error?.response?.status !== 405) throw error;
      const { data } = await api.get<any>(ENDPOINTS.USERS.USER_INFO);
      const user = data?.data?.user ?? data?.data ?? data?.user ?? data;
      if (!user?.id) throw new Error('API không trả thông tin tài khoản');
      return user;
    }
  },
  update: async (id: string, payload: UpdateUserPayload): Promise<UserListItem> => {
    const { data } = await api.patch<any>(ENDPOINTS.USERS.ME, payload);
    return data?.data ?? data;
  },
  getUserStats: async (id = 'me'): Promise<UserStats> => unwrap(await api.get(ENDPOINTS.USERS.STATS(id))),
  getUserActivity: async (id = 'me'): Promise<UserActivity[]> => {
    const result = unwrap<any>(await api.get(ENDPOINTS.USERS.ACTIVITY(id)));
    return Array.isArray(result) ? result : [];
  },
  uploadAvatar: async (avatarUrl: string) => unwrap(await api.post(ENDPOINTS.USERS.AVATAR, { avatarUrl })),
  getAll: async (params?: Record<string, unknown>): Promise<UserListItem[]> => {
    const result = unwrap<any>(await api.get(ENDPOINTS.USERS.LIST, { params }));
    return Array.isArray(result) ? result : [];
  },
  delete: async (id: string) => unwrap(await api.delete(ENDPOINTS.USERS.BY_ID(id))),
};
