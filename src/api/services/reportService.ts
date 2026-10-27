import { ENDPOINTS } from "@/api/endpoints";
import { ENV } from "@/config/env";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/authStore";
import * as ImageManipulator from "expo-image-manipulator";
import { Platform } from "react-native";

async function prepareOptimizedImage(uri: string): Promise<string> {
	try {
		const manipulated = await ImageManipulator.manipulateAsync(
			uri,
			[{ resize: { width: 720 } }],
			{ compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
		);
		return manipulated.uri;
	} catch (e) {
		console.warn('Image compression fallback:', e);
		return uri;
	}
}

// ============================================================
// Types
// ============================================================
interface Reporter {
	id: string;
	email: string;
}
export interface Report {
	id: string;
	title?: string;
	description?: string;
	location?: string;
	latitude?: number;
	longitude?: number;
	report_img: string;
	/** Ảnh thu nhỏ (256px) cho marker bản đồ; rỗng nếu server chưa có. */
	thumb?: string;
	severity?: string;
	waste_types?: string[];
	pointsEarned?: number;
	newTotal?: number;
	status?: string;
	reporter: Reporter;
	created_at?: string;
	updated_at?: string;
	[key: string]: unknown;
}

export interface ReportImage {
	id: string;
	report_id?: string;
	image_url?: string;
	[key: string]: unknown;
}

export interface AiWasteScanResult {
	points: number;
	color: string;
	severity: 'none' | 'low' | 'medium' | 'high' | 'critical' | string;
	has_waste: boolean;
	waste_types?: string[];
	confidence?: number;
	reason: string;
}

// CreateReportPayload là FormData được build sẵn từ phía UI
// (không còn dùng plain object để tránh bug String(file) = "[object Object]")
export type CreateReportPayload = FormData;

// ============================================================
// API Functions
// ============================================================

export const getDaklakMapUrl = (): string => ENV.DAKLAK_MAP_URL || ENV.API_BASE_URL || 'http://localhost:8000';
export const getDaklakMapPageUrl = (): string => `${getDaklakMapUrl().replace(/\/$/, '')}/opendesign/mockups/daklak-map/`;

export const DAKLAK_MAP_URL = getDaklakMapUrl();

const getPhotoImageUrl = (photo: any): string => {
	const image = photo?.image_url || photo?.imageUrl || photo?.url || photo?.original || (Array.isArray(photo?.photo_urls) && photo.photo_urls[0]) || photo?.thumb;
	if (typeof image !== 'string' || !image.trim()) return '';
	if (/^(https?:|data:|blob:)/i.test(image)) return image;
	return `${getDaklakMapUrl().replace(/\/$/, '')}/${image.replace(/^\//, '')}`;
};

/** Ảnh thu nhỏ dùng cho marker trên bản đồ (ưu tiên bản 256px do server lưu). */
const getPhotoThumbUrl = (photo: any): string => {
	const thumb = photo?.thumb;
	if (typeof thumb !== 'string' || !thumb.trim()) return '';
	if (/^(https?:|data:|blob:)/i.test(thumb)) return thumb;
	return `${getDaklakMapUrl().replace(/\/$/, '')}/${thumb.replace(/^\//, '')}`;
};
/**
 * Cross-platform FormData reader:
 * Web FormData supports fd.get(key), while React Native FormData polyfill stores entries in fd._parts: [ [key, value], ... ]
 */
const getFormDataValue = (formData: any, key: string): any => {
	if (!formData) return undefined;
	if (typeof formData.get === 'function') {
		const val = formData.get(key);
		if (val !== undefined && val !== null) return val;
	}
	if (Array.isArray(formData._parts)) {
		const part = formData._parts.find(([k]: [string, any]) => k === key);
		if (part) return part[1];
	}
	return undefined;
};

export const reportService = {
	/** GET danh sách ảnh từ Bản đồ Đắk Lắk */
	getAll: async (params?: Record<string, unknown>): Promise<Report[]> => {
		try {
			const baseUrl = getDaklakMapUrl();
			const res = await fetch(`${baseUrl}/api/photos?_t=${Date.now()}`, { cache: 'no-store' });
			if (!res.ok) throw new Error('Failed to fetch from Dak Lak map');
			const json = await res.json();
			const photos = Array.isArray(json) ? json : (json.photos || []);

			if (photos.length === 0) {
				return [];
			}

			return photos.map((p: any) => ({
				id: String(p.id),
				title: p.title || p.name || 'Điểm rác Đắk Lắk',
				description: p.description || (p.exif?.datetime ? `Chụp lúc: ${p.exif.datetime}` : (p.hasGps ? 'GPS từ EXIF' : 'Ghim vị trí')),
				location: p.title || (p.outside ? 'Ngoại vi Đắk Lắk' : 'Tỉnh Đắk Lắk'),
				latitude: Number(p.lat) || 12.6828,
				longitude: Number(p.lng) || 108.0378,
				report_img: getPhotoImageUrl(p),
				thumb: getPhotoThumbUrl(p),
				severity: p.severity || 'medium',
				waste_types: Array.isArray(p.waste_types) ? p.waste_types : [],
				status: p.status || 'reported',
				reporter: {
					id: p.userid || 'user-daklak',
					email: p.userid || 'daklak-volunteer@ecopick.vn',
				},
				created_at: new Date(p.createdAt || Date.now()).toISOString(),
			}));
		} catch (error) {
			console.log('Error fetching Dak Lak map photos:', error);
			return [];
		}
	},

	/** GET /api/report/reports/{id}/ */
	getById: async (id: string): Promise<Report> => {
		const all = await reportService.getAll();
		const found = all.find((r) => r.id === id);
		if (found) return found;
		return {
			id,
			title: 'Điểm rác Đắk Lắk',
			report_img: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=400',
			reporter: { id: 'admin', email: 'admin@ecopick.vn' },
			latitude: 12.6828,
			longitude: 108.0378,
		};
	},

	/** POST /api/upload lên Bản đồ Đắk Lắk */
	create: async (formData: CreateReportPayload): Promise<Report> => {
		try {
			const uploadFormData = new FormData();
			const rawImage: any = getFormDataValue(formData, 'report_img') || getFormDataValue(formData, 'image');

			if (typeof rawImage === 'string' || !rawImage) {
				// Chuỗi "[object Object]" = FormData web đã stringify object ảnh → không phải tệp
				throw new Error('Không tìm thấy ảnh để tải lên');
			}
			if ((rawImage as Blob).size !== undefined && !rawImage.uri) {
				// Blob/File (web) — giữ tên tệp để server nhận diện đúng file part
				uploadFormData.append('image', rawImage, (rawImage as File).name || 'daklak_report.jpg');
			} else if (Platform.OS === 'web' && rawImage.uri) {
				// Chuyển uri sang Blob trên web
				const blob = await fetch(rawImage.uri).then((r) => r.blob());
				uploadFormData.append('image', blob, rawImage.name || 'daklak_report.jpg');
			} else {
				// Android / iOS: append object { uri, name, type }
				uploadFormData.append('image', rawImage);
			}

			const currentAuthUser = useAuthStore.getState().user;
			const uploaderName = (getFormDataValue(formData, 'name') as string) || (getFormDataValue(formData, 'uploader') as string) || (getFormDataValue(formData, 'reporter_name') as string) || currentAuthUser?.full_name || currentAuthUser?.fullname || 'EcoPick Admin';
			uploadFormData.append('name', uploaderName);
			uploadFormData.append('uploader', uploaderName);

			const title = (getFormDataValue(formData, 'title') as string) || (getFormDataValue(formData, 'address') as string) || (getFormDataValue(formData, 'location') as string) || (getFormDataValue(formData, 'description') as string) || 'Báo cáo rác Đắk Lắk';
			uploadFormData.append('title', title);

			const userId = (getFormDataValue(formData, 'reporter_id') as string) || currentAuthUser?.email || currentAuthUser?.id || 'admin@ecopick.vn';
			uploadFormData.append('userid', userId);

			const lat = getFormDataValue(formData, 'latitude') as string;
			const lng = getFormDataValue(formData, 'longitude') as string;
			if (lat && lat !== '0') uploadFormData.append('lat', lat);
			if (lng && lng !== '0') uploadFormData.append('lng', lng);
			const severity = (getFormDataValue(formData, 'severity') as string) || 'medium';
			uploadFormData.append('severity', severity);

			const rawThumb: any = getFormDataValue(formData, 'thumb');
			if (rawThumb) {
				if ((rawThumb as Blob).size !== undefined && !rawThumb.uri) {
					uploadFormData.append('thumb', rawThumb, (rawThumb as File).name || 'thumb.jpg');
				} else if (Platform.OS === 'web' && rawThumb.uri) {
					const thumbBlob = await fetch(rawThumb.uri).then((r) => r.blob());
					uploadFormData.append('thumb', thumbBlob, rawThumb.name || 'thumb.jpg');
				} else {
					uploadFormData.append('thumb', rawThumb);
				}
			}

			const wasteType = (getFormDataValue(formData, 'waste_type') as string) || (getFormDataValue(formData, 'wasteTypes') as string);
			if (wasteType) uploadFormData.append('waste_type', wasteType);

			const desc = getFormDataValue(formData, 'description') as string;
			if (desc) uploadFormData.append('description', desc);

			const aiPoints = getFormDataValue(formData, 'ai_points') as string;
			if (aiPoints) uploadFormData.append('ai_points', aiPoints);
			const aiColor = getFormDataValue(formData, 'ai_color') as string;
			if (aiColor) uploadFormData.append('ai_color', aiColor);
			const aiSeverity = getFormDataValue(formData, 'ai_severity') as string;
			if (aiSeverity) uploadFormData.append('ai_severity', aiSeverity);
			const aiReason = getFormDataValue(formData, 'ai_reason') as string;
			if (aiReason) uploadFormData.append('ai_reason', aiReason);
			uploadFormData.append('datetime', new Date().toLocaleString('vi-VN'));
			uploadFormData.append('model', 'EcoPick App');

			const baseUrl = getDaklakMapUrl();
			const token = useAuthStore.getState().token;
			const res = await fetch(`${baseUrl}/api/upload`, {
				method: 'POST',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				body: uploadFormData,
			});

			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data?.error?.message || data?.detail || 'Failed to submit report');
			const payload = data?.data ?? data;

			return {
				id: payload.id || 'daklak_' + Date.now(),
				title: payload.title || title,
				location: title,
				latitude: payload.lat ?? (lat ? parseFloat(lat) : 12.6828),
				longitude: payload.lng ?? (lng ? parseFloat(lng) : 108.0378),
				report_img: getPhotoImageUrl(payload),
				thumb: getPhotoThumbUrl(payload),
				severity,
				pointsEarned: Number(payload.pointsEarned || 0),
				newTotal: Number(payload.newTotal || 0),
				status: 'reported',
				reporter: { id: userId, email: userId },
				created_at: new Date().toISOString(),
			};
		} catch (error) {
			console.error('Upload to Dak Lak map error:', error);
			throw error;
		}
	},

	/** PATCH /api/report/reports/{id}/ */
	update: async (id: string, payload: Partial<Report>) => {
		return { id, ...payload } as any;
	},

	/** DELETE /api/photos/{id} trên Bản đồ Đắk Lắk — chỉ quản trị viên (server trả 403 nếu không). */
	delete: async (id: string) => {
		const baseUrl = getDaklakMapUrl();
		const token = useAuthStore.getState().token;
		// Trước đây bỏ qua kết quả nên 401/403 vẫn báo thành công — người dùng tưởng đã xóa.
		const res = await fetch(`${baseUrl}/api/photos/${encodeURIComponent(id)}`, {
			method: 'DELETE',
			headers: token ? { Authorization: `Bearer ${token}` } : undefined,
		});
		if (!res.ok) throw new Error('Không thể xóa ảnh (cần quyền quản trị viên)');
		return { success: true };
	},

	/** POST /api/ai/scan để thẩm định và chấm điểm ảnh trước khi nộp (đã nén ảnh để giảm độ trễ) */
	scanWasteImage: async (imageUri: string): Promise<AiWasteScanResult | null> => {
		try {
			const optimizedUri = await prepareOptimizedImage(imageUri);
			const formData = new FormData();
			const fileName = `scan_${Date.now()}.jpg`;
			if (Platform.OS === 'web') {
				const blob = await fetch(optimizedUri).then((r) => r.blob());
				formData.append('image', blob, fileName);
			} else {
				formData.append('image', { uri: optimizedUri, name: fileName, type: 'image/jpeg' } as any);
			}

			const baseUrl = getDaklakMapUrl();
			const token = useAuthStore.getState().token;
			const res = await fetch(`${baseUrl}/api/ai/scan`, {
				method: 'POST',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				body: formData,
			});
			if (!res.ok) return null;
			const json = await res.json();
			return json?.data ?? json;
		} catch (err) {
			console.warn('AI waste scan error:', err);
			return null;
		}
	},
};

export const reportImageService = {
	/** GET /api/report-images/ */
	getAll: async (params?: Record<string, unknown>): Promise<ReportImage[]> => {
		try {
			const { data } = await api.get(ENDPOINTS.REPORTS.IMAGES.LIST, { params });
			if (Array.isArray(data)) return data as ReportImage[];
			const inner = (data as any)?.data ?? data;
			if (Array.isArray(inner)) return inner as ReportImage[];
			if (inner && Array.isArray(inner.images)) return inner.images as ReportImage[];
			if (inner && Array.isArray(inner.results)) return inner.results as ReportImage[];
			return [];
		} catch (e) {
			return [];
		}
	},

	/** POST /api/report-images/ */
	create: async (payload: FormData): Promise<ReportImage> => {
		const { data } = await api.post<ReportImage>(ENDPOINTS.REPORTS.IMAGES.LIST, payload, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return ((data as any)?.data ?? data) as ReportImage;
	},

	/** DELETE /api/report-images/{id}/ */
	delete: async (id: string) => {
		const { data } = await api.delete(ENDPOINTS.REPORTS.IMAGES.BY_ID(id));
		return data;
	},
};
