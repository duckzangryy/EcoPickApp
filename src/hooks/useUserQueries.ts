import { queryKeys } from "@/api/queryKeys";
import {
	authService,
	userService,
	type ForgotPasswordPayload,
	type RegisterPayload,
	type ResetPasswordPayload,
	type SignInPayload,
	type SignUpPayload,
	type UpdateUserPayload,
	type VerifyEmailPayload,
} from "@/api/services/userService";
import { useAuthStore } from "@/stores/authStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ============================================================
// Auth Mutations (04-BACKEND-API.md Section 3.1)
// ============================================================

/** Đăng nhập → lưu token + fetch userInfo → lưu vào store */
export const useSignIn = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (payload: SignInPayload) => {
			// 1. Đăng nhập lấy token
			const authResponse = await authService.signIn(payload);
			const token = authResponse.access_token || authResponse.accessToken || '';
			const refreshToken = authResponse.refresh_token || authResponse.refreshToken || '';

			// 2. Lưu token tạm để axios interceptor gắn vào header mà CHƯA kích hoạt isAuthenticated
			useAuthStore.getState().setToken(token, refreshToken);

			if (!token || token.startsWith('mock_')) throw new Error('API không cấp token đăng nhập hợp lệ');

			// 3. Fetch userInfo đầy đủ (bây giờ axios đã có token)
			const userInfo = authResponse.user || await userService.getUserInfo();
			if (!userInfo?.id) throw new Error('API không trả thông tin tài khoản hợp lệ');

			// 4. Kích hoạt auth chính thức (sẽ set isAuthenticated = true và trigger NavigationGuard)
			useAuthStore.getState().setAuth(token, refreshToken, userInfo);

			return { auth: authResponse, user: userInfo };
		},
		onSuccess: () => {
			queryClient.invalidateQueries();
		},
	});
};

/** Đăng ký tài khoản */
export const useSignUp = () => {
	return useMutation({
		mutationFn: (payload: SignUpPayload | RegisterPayload) => authService.signUp(payload),
	});
};

export const useRegister = useSignUp;

/** Xác thực email bằng OTP */
export const useVerifyEmail = () => {
	return useMutation({
		mutationFn: (payload: VerifyEmailPayload) => authService.verifyEmail(payload),
	});
};

/** Quên mật khẩu - gửi mã xác nhận */
export const useForgotPassword = () => {
	return useMutation({
		mutationFn: (payload: ForgotPasswordPayload) => authService.forgotPassword(payload),
	});
};

/** Đặt lại mật khẩu với token/OTP */
export const useResetPassword = () => {
	return useMutation({
		mutationFn: (payload: ResetPasswordPayload) => authService.resetPassword(payload),
	});
};

/** Đăng xuất */
export const useSignOut = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			await authService.logout();
			useAuthStore.getState().logout();
		},
		onSuccess: () => {
			queryClient.clear();
		},
	});
};

// ============================================================
// User Queries (04-BACKEND-API.md Section 3.2)
// ============================================================

/** Lấy thông tin user hiện tại – GET /api/v1/users/me */
export const useUserInfo = () => {
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

	return useQuery({
		queryKey: queryKeys.users.userInfo(),
		queryFn: () => userService.getUserInfo(),
		enabled: isAuthenticated,
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	});
};

/** Lấy thống kê user – GET /api/v1/users/:id/stats */
export const useUserStats = (id: string = 'me') => {
	return useQuery({
		queryKey: ['users', 'stats', id],
		queryFn: () => userService.getUserStats(id),
	});
};

/** Lấy lịch sử hoạt động – GET /api/v1/users/:id/activity */
export const useUserActivity = (id: string = 'me') => {
	return useQuery({
		queryKey: ['users', 'activity', id],
		queryFn: () => userService.getUserActivity(id),
	});
};

/** Lấy danh sách users – GET /api/users/ */
export const useUsers = (filters?: Record<string, unknown>) => {
	return useQuery({
		queryKey: queryKeys.users.list(filters),
		queryFn: () => userService.getAll(filters),
	});
};

// ============================================================
// User Mutations
// ============================================================

/** Cập nhật user – PATCH /api/v1/users/me */
export const useUpdateUser = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) => userService.update(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
		},
		onError: (error: any) => {
			const errorMsg =
				error?.response?.data?.error?.message ||
				error?.response?.data?.detail ||
				error?.message ||
				"Cập nhật thông tin thất bại.";
			console.log("UPDATE PROFILE ERROR:", errorMsg);
		},
	});
};

/** Xóa user – DELETE /api/users/{id}/ */
export const useDeleteUser = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => userService.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
		},
	});
};
