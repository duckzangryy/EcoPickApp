import { ENDPOINTS } from "@/api/endpoints";
import api from "@/lib/axios";

// ============================================================
// Types – Dựa trên API response: GET /api/event/events/
// ============================================================

export interface Event {
	id: string;
	title: string;
	description: string;
	cover_image_url: string | null;
	type: string; // "clean up", etc.
	start_date: string; // "20/05/2026 07:00:00"
	end_date: string;
	latitude: number;
	longitude: number;
	location: string;
	address: string;
	max_paticipants: number;
	current_paticipants: number;
	equipment: string;
	difficulty: string; // "easy" | "medium" | "hard"
	eco_point_reward: number;
	status: string; // "upcoming" | "ongoing" | "completed"
	created_at: string;
	updated_at: string;
	organizer_id: string;
}

export interface CreateEventPayload {
	organizer_id: string;
	title: string;
	type: string;
	location: string;
	latitude: number | string;
	longitude: number | string;
	start_date: string;
	end_date: string;
	address?: string;
	description?: string;
	equipment?: string;
	difficulty?: string;
	cover_image_url?: string;
	max_paticipants?: number;
	current_paticipants?: number;
	eco_point_reward?: number;
	status?: string;
}

export interface EventParticipant {
	id: string;
	status: string; // "joined"	joined_at: string;
	checked_in_at: string;
	event: string;
	user: string;
	participant: {
		id: string;
		fullname: string;
		avatar: string;
		email: string;
	}
}

export interface JoinEventPayload {
	event: string;
	user: string;
	checked_in_at?: string;
	status?: string;
}

export interface TourStop {
	id: string;
	[key: string]: unknown;
}

// ============================================================
// Helper: normalize API response sang array hoặc object
// ============================================================
function extractArray<T>(raw: any, keys: string[]): T[] {
	if (Array.isArray(raw)) return raw as T[];
	const inner = raw?.data ?? raw;
	for (const k of keys) {
		if (Array.isArray(inner?.[k])) return inner[k] as T[];
	}
	if (Array.isArray(inner)) return inner as T[];
	return [];
}

function extractObject<T>(raw: any): T {
	if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
		// { success, data: {...} }
		const inner = raw?.data ?? raw;
		return inner as T;
	}
	return raw as T;
}

// ============================================================
// API Functions
// ============================================================

export const eventService = {
	/** Lấy danh sách events – GET /api/event/events/ */
	getAll: async (params?: Record<string, unknown>): Promise<Event[]> => {
		const { data } = await api.get(ENDPOINTS.EVENTS.LIST, { params });
		return extractArray<Event>(data, ['events', 'results']);
	},

	/** Lấy chi tiết event – GET /api/event/events/{id}/ */
	getById: async (id: string): Promise<Event> => {
		const { data } = await api.get(ENDPOINTS.EVENTS.BY_ID(id));
		return extractObject<Event>(data);
	},

	/** Tạo event – POST /api/event/events/ (formdata) */
	create: async (payload: CreateEventPayload): Promise<Event> => {
		const { data } = await api.post(ENDPOINTS.EVENTS.LIST, payload);
		return extractObject<Event>(data);
	},

	/** Xóa event – DELETE /api/event/events/{id}/ */
	delete: async (id: string) => {
		const { data } = await api.delete(ENDPOINTS.EVENTS.BY_ID(id));
		return data;
	},
};

export const eventParticipantService = {
	/** Lấy danh sách participants – GET /api/event/event-participants/ */
	getAll: async (params?: Record<string, unknown>): Promise<EventParticipant[]> => {
		const { data } = await api.get(ENDPOINTS.EVENTS.PARTICIPANTS.LIST, { params });
		return extractArray<EventParticipant>(data, ['participants', 'results']);
	},

	/** Tham gia event – POST /api/event/event-participants/ (formdata) */
	join: async (payload: JoinEventPayload): Promise<EventParticipant & { pointsEarned?: number; newTotal?: number }> => {
		const formData = new FormData();
		formData.append("event", payload.event);
		formData.append("user", payload.user);
		if (payload.checked_in_at) formData.append("checked_in_at", payload.checked_in_at);
		const { data } = await api.post(ENDPOINTS.EVENTS.PARTICIPANTS.LIST, formData);
		return extractObject<EventParticipant & { pointsEarned?: number; newTotal?: number }>(data);
	},

	/** Lấy chi tiết participant – GET /api/event/event-participants/{id}/ */
	getById: async (event_id: string): Promise<EventParticipant> => {
		const { data } = await api.get(ENDPOINTS.EVENTS.PARTICIPANTS.BY_ID(event_id));
		return extractObject<EventParticipant>(data);
	},

	/** Hủy tham gia event – DELETE /api/event/event-participants/{id}/ */
	leave: async (event_id: string) => {
		const { data } = await api.delete(ENDPOINTS.EVENTS.PARTICIPANTS.BY_ID(event_id));
		return data;
	},
};

export const tourStopService = {
	/** Lấy danh sách tour stops – GET /api/event/tour-stops/ */
	getAll: async (params?: Record<string, unknown>): Promise<TourStop[]> => {
		const { data } = await api.get(ENDPOINTS.EVENTS.TOUR_STOPS.LIST, { params });
		return extractArray<TourStop>(data, ['tour_stops', 'results']);
	},
};
