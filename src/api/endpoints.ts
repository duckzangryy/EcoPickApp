// ============================================================
// API Endpoints – Mapping 1:1 với 04-BACKEND-API.md & Postman
// Base: EXPO_PUBLIC_API_BASE_URL (http://localhost:8000)
// ============================================================

export const ENDPOINTS = {
	// ── 1. Authentication (04-BACKEND-API.md Section 3.1) ────────
	AUTH: {
		REGISTER: "/api/v1/auth/register",
		LOGIN: "/api/v1/auth/login",
		VERIFY_EMAIL: "/api/v1/auth/verify-email",
		FORGOT_PASSWORD: "/api/v1/auth/forgot-password",
		RESET_PASSWORD: "/api/v1/auth/reset-password",
		REFRESH: "/api/v1/auth/refresh",
		LOGOUT: "/api/v1/auth/logout",
		GOOGLE: "/api/v1/auth/google",
		APPLE: "/api/v1/auth/apple",
	},

	// ── 2. Users (04-BACKEND-API.md Section 3.2 + Legacy) ─────────
	USERS: {
		ME: "/api/v1/users/me",
		USER_INFO: "/api/users/userinfo/",
		SIGN_IN: "/api/users/signin/",
		SIGN_UP: "/api/users/signup/",
		LIST: "/api/users/",
		BY_ID: (id: string) => `/api/users/${id}/`,
		STATS: (id: string) => `/api/v1/users/${id}/stats`,
		ACTIVITY: (id: string) => `/api/v1/users/${id}/activity`,
		BADGES: (id: string) => `/api/v1/users/${id}/badges`,
		AVATAR: "/api/v1/users/me/avatar",
		FCM_TOKEN: "/api/v1/users/me/fcm-token",
		FOLLOW: (id: string) => `/api/v1/users/${id}/follow`,
	},

	// ── 3. Waste Reports (04-BACKEND-API.md Section 3.3) ──────────
	REPORTS: {
		LIST: "/api/report/reports/",
		V1_LIST: "/api/v1/reports",
		NEARBY: "/api/v1/reports/nearby",
		BY_ID: (id: string) => `/api/report/reports/${id}/`,
		STATUS: (id: string) => `/api/v1/reports/${id}/status`,
		UPVOTE: (id: string) => `/api/v1/reports/${id}/upvote`,
		CLAIM: (id: string) => `/api/v1/reports/${id}/claim`,
		COMMENTS: (id: string) => `/api/v1/reports/${id}/comments`,
		IMAGES: {
			LIST: "/api/report/report-images/",
			BY_ID: (id: string) => `/api/report/report-images/${id}/`,
		},
	},

	// ── 4. Uploads (04-BACKEND-API.md Section 3.11) ───────────────
	UPLOADS: {
		PRESIGNED: "/api/v1/uploads/presigned",
	},

	// ── 5. Events (04-BACKEND-API.md Section 3.4) ─────────────────
	EVENTS: {
		LIST: "/api/event/events/",
		V1_LIST: "/api/v1/events",
		NEARBY: "/api/v1/events/nearby",
		BY_ID: (id: string) => `/api/event/events/${id}/`,
		JOIN: (id: string) => `/api/v1/events/${id}/join`,
		CHECK_IN: (id: string) => `/api/v1/events/${id}/check-in`,
		PARTICIPANTS: {
			LIST: "/api/event/event-participants/",
			BY_ID: (id: string) => `/api/event/event-participants/${id}/`,
		},
		TOUR_STOPS: {
			LIST: "/api/event/tour-stops/",
			BY_ID: (id: string) => `/api/event/tour-stops/${id}/`,
		},
	},

	// ── 6. Social / Posts (04-BACKEND-API.md Section 3.6) ─────────
	POSTS: {
		LIST: "/api/post/posts/",
		FEED: "/api/v1/feed",
		DISCOVER: "/api/v1/feed/discover",
		BY_ID: (id: string) => `/api/post/posts/${id}/`,
		LIKE: (id: string) => `/api/v1/posts/${id}/like`,
		COMMENTS: {
			LIST: "/api/post/comments/",
			BY_ID: (id: string) => `/api/post/comments/${id}/`,
		},
		LIKES: {
			LIST: "/api/post/likes/",
			BY_ID: (id: string) => `/api/post/likes/${id}/`,
		},
		MEDIA: {
			LIST: "/api/post/post-media/",
			BY_ID: (id: string) => `/api/post/post-media/${id}/`,
		},
	},

	// ── 7. Gamification (04-BACKEND-API.md Section 3.9) ───────────
	GAMIFICATION: {
		LEADERBOARD: "/api/v1/leaderboard",
		CHALLENGES: "/api/v1/challenges/daily",
		POINTS_HISTORY: "/api/v1/points/history",
		REWARDS: "/api/v1/rewards",
		REDEEM: (id: string) => `/api/v1/rewards/${id}/redeem`,
	},

	// ── 8. Notifications (04-BACKEND-API.md Section 3.10) ─────────
	NOTIFICATIONS: {
		LIST: "/api/v1/notifications",
		READ: (id: string) => `/api/v1/notifications/${id}/read`,
		READ_ALL: "/api/v1/notifications/read-all",
		UNREAD_COUNT: "/api/v1/notifications/unread-count",
	},

	// ── 9. Roles & Badges & Chat (Legacy + v1) ────────────────────
	ROLES: {
		LIST: "/api/roles/",
		BY_ID: (id: string) => `/api/roles/${id}/`,
	},
	CHAT: {
		CONVERSATIONS: {
			LIST: "/api/chat/conversations/",
			BY_ID: (id: string) => `/api/chat/conversations/${id}/`,
		},
		MEMBERS: {
			LIST: "/api/chat/conversation-members/",
			BY_ID: (id: string) => `/api/chat/conversation-members/${id}/`,
		},
		MESSAGES: {
			LIST: "/api/chat/messages/",
			BY_ID: (id: string) => `/api/chat/messages/${id}/`,
		},
		POINT_LOGS: {
			LIST: "/api/chat/point-logs/",
			BY_ID: (id: string) => `/api/chat/point-logs/${id}/`,
		},
	},
	BADGES: {
		LIST: "/api/badge/badges/",
		BY_ID: (id: string) => `/api/badge/badges/${id}/`,
		USER_BADGES: {
			LIST: "/api/badge/user-badges/",
			BY_ID: (id: string) => `/api/badge/user-badges/${id}/`,
		},
		EXCHANGE_ITEMS: {
			LIST: "/api/badge/exchange-items/",
			BY_ID: (id: string) => `/api/badge/exchange-items/${id}/`,
			REDEEM: (id: string) => `/api/badge/exchange-items/${id}/redeem/`,
		},
		REDEMPTIONS: {
			LIST: "/api/badge/redemptions/",
			BY_ID: (id: string) => `/api/badge/redemptions/${id}/`,
		},
	},
} as const;
