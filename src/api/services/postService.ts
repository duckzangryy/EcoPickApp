import api from '@/lib/axios';
import { ENDPOINTS } from '@/api/endpoints';

// ============================================================
// Types
// ============================================================

export interface Post {
  id: string;
  content?: string;
  caption?: string;
  author_id?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface PostComment {
  id: string;
  content?: string;
  post_id?: string;
  user_id?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface PostLike {
  id: string;
  post_id?: string;
  user_id?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface PostMedia {
  id: string;
  post_id?: string;
  media_url?: string;
  media_type?: string;
  [key: string]: unknown;
}

export interface CreatePostPayload {
  [key: string]: unknown;
}

export interface CreateCommentPayload {
  [key: string]: unknown;
}

export interface CreateLikePayload {
  [key: string]: unknown;
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

export const postService = {
  /** GET /api/post/posts/ */
  getAll: async (params?: Record<string, unknown>): Promise<Post[]> => {
    const { data } = await api.get(ENDPOINTS.POSTS.LIST, { params });
    return extractArray<Post>(data, ['posts', 'results']);
  },

  /** GET /api/post/posts/{id}/ */
  getById: async (id: string): Promise<Post> => {
    const { data } = await api.get(ENDPOINTS.POSTS.BY_ID(id));
    return extractObject<Post>(data);
  },

  /** POST /api/post/posts/ */
  create: async (payload: CreatePostPayload): Promise<Post> => {
    const { data } = await api.post(ENDPOINTS.POSTS.LIST, payload);
    return extractObject<Post>(data);
  },

  /** DELETE /api/post/posts/{id}/ */
  delete: async (id: string) => {
    const { data } = await api.delete(ENDPOINTS.POSTS.BY_ID(id));
    return data;
  },

  /** PATCH /api/post/posts/{id}/ */
  update: async (id: string, payload: Partial<Post>): Promise<Post> => {
    const { data } = await api.patch(ENDPOINTS.POSTS.BY_ID(id), payload);
    return extractObject<Post>(data);
  },
};

export const commentService = {
  /** GET /api/post/comments/ */
  getAll: async (params?: Record<string, unknown>): Promise<PostComment[]> => {
    const { data } = await api.get(ENDPOINTS.POSTS.COMMENTS.LIST, { params });
    return extractArray<PostComment>(data, ['comments', 'results']);
  },

  /** POST /api/post/comments/ */
  create: async (payload: CreateCommentPayload): Promise<PostComment> => {
    const { data } = await api.post(ENDPOINTS.POSTS.COMMENTS.LIST, payload);
    return extractObject<PostComment>(data);
  },

  /** DELETE /api/post/comments/{id}/ */
  delete: async (id: string) => {
    const { data } = await api.delete(ENDPOINTS.POSTS.COMMENTS.BY_ID(id));
    return data;
  },
};

export const likeService = {
  /** GET /api/post/likes/ */
  getAll: async (params?: Record<string, unknown>): Promise<PostLike[]> => {
    const { data } = await api.get(ENDPOINTS.POSTS.LIKES.LIST, { params });
    return extractArray<PostLike>(data, ['likes', 'results']);
  },

  /** POST /api/post/likes/ */
  create: async (payload: CreateLikePayload): Promise<PostLike> => {
    const { data } = await api.post(ENDPOINTS.POSTS.LIKES.LIST, payload);
    return extractObject<PostLike>(data);
  },

  /** DELETE /api/post/likes/{id}/ */
  delete: async (id: string) => {
    const { data } = await api.delete(ENDPOINTS.POSTS.LIKES.BY_ID(id));
    return data;
  },
};

export const postMediaService = {
  /** GET /api/post/post-media/ */
  getAll: async (params?: Record<string, unknown>) => {
    const { data } = await api.get<PostMedia[]>(ENDPOINTS.POSTS.MEDIA.LIST, { params });
    return data;
  },

  /** POST /api/post/post-media/ */
  create: async (payload: FormData) => {
    const { data } = await api.post<PostMedia>(ENDPOINTS.POSTS.MEDIA.LIST, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  /** DELETE /api/post/post-media/{id}/ */
  delete: async (id: string) => {
    const { data } = await api.delete(ENDPOINTS.POSTS.MEDIA.BY_ID(id));
    return data;
  },
};
