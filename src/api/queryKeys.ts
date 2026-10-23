// ============================================================
// Query Keys Factory – Quản lý query keys tập trung
// Mỗi module có: all → lists → list(filters) → details → detail(id)
// ============================================================

export const queryKeys = {
  // ── Users ──────────────────────────────────────────────────
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    userInfo: () => [...queryKeys.users.all, 'userInfo'] as const,
  },

  // ── Roles ──────────────────────────────────────────────────
  roles: {
    all: ['roles'] as const,
    lists: () => [...queryKeys.roles.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.roles.lists(), filters] as const,
    details: () => [...queryKeys.roles.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.roles.details(), id] as const,
  },

  // ── Events ─────────────────────────────────────────────────
  events: {
    all: ['events'] as const,
    lists: () => [...queryKeys.events.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.events.lists(), filters] as const,
    details: () => [...queryKeys.events.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.events.details(), id] as const,

    participants: {
      all: ['event-participants'] as const,
      lists: () => [...queryKeys.events.participants.all, 'list'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.events.participants.lists(), filters] as const,
      detail: (id: string) =>
        [...queryKeys.events.participants.all, 'detail', id] as const,
    },

    tourStops: {
      all: ['tour-stops'] as const,
      lists: () => [...queryKeys.events.tourStops.all, 'list'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.events.tourStops.lists(), filters] as const,
      detail: (id: string) =>
        [...queryKeys.events.tourStops.all, 'detail', id] as const,
    },
  },

  // ── Posts ───────────────────────────────────────────────────
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.posts.lists(), filters] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.posts.details(), id] as const,

    comments: {
      all: ['post-comments'] as const,
      lists: () => [...queryKeys.posts.comments.all, 'list'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.posts.comments.lists(), filters] as const,
      detail: (id: string) =>
        [...queryKeys.posts.comments.all, 'detail', id] as const,
    },

    likes: {
      all: ['post-likes'] as const,
      lists: () => [...queryKeys.posts.likes.all, 'list'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.posts.likes.lists(), filters] as const,
    },

    media: {
      all: ['post-media'] as const,
      lists: () => [...queryKeys.posts.media.all, 'list'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.posts.media.lists(), filters] as const,
      detail: (id: string) =>
        [...queryKeys.posts.media.all, 'detail', id] as const,
    },
  },

  // ── Reports ────────────────────────────────────────────────
  reports: {
    all: ['reports'] as const,
    lists: () => [...queryKeys.reports.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.reports.lists(), filters] as const,
    details: () => [...queryKeys.reports.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.reports.details(), id] as const,

    images: {
      all: ['report-images'] as const,
      lists: () => [...queryKeys.reports.images.all, 'list'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.reports.images.lists(), filters] as const,
    },
  },

  // ── Chat ───────────────────────────────────────────────────
  chat: {
    conversations: {
      all: ['conversations'] as const,
      lists: () => [...queryKeys.chat.conversations.all, 'list'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.chat.conversations.lists(), filters] as const,
      detail: (id: string) =>
        [...queryKeys.chat.conversations.all, 'detail', id] as const,
    },

    members: {
      all: ['conversation-members'] as const,
      lists: () => [...queryKeys.chat.members.all, 'list'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.chat.members.lists(), filters] as const,
    },

    messages: {
      all: ['chat-messages'] as const,
      lists: () => [...queryKeys.chat.messages.all, 'list'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.chat.messages.lists(), filters] as const,
    },

    pointLogs: {
      all: ['point-logs'] as const,
      lists: () => [...queryKeys.chat.pointLogs.all, 'list'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.chat.pointLogs.lists(), filters] as const,
    },
  },

  // ── Badges ─────────────────────────────────────────────────
  badges: {
    all: ['badges'] as const,
    lists: () => [...queryKeys.badges.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.badges.lists(), filters] as const,
    details: () => [...queryKeys.badges.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.badges.details(), id] as const,

    userBadges: {
      all: ['user-badges'] as const,
      lists: () => [...queryKeys.badges.userBadges.all, 'list'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.badges.userBadges.lists(), filters] as const,
    },

    exchangeItems: {
      all: ['exchange-items'] as const,
      lists: () => [...queryKeys.badges.exchangeItems.all, 'list'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.badges.exchangeItems.lists(), filters] as const,
      detail: (id: string) =>
        [...queryKeys.badges.exchangeItems.all, 'detail', id] as const,
    },
    redemptions: {
      all: ['redemptions'] as const,
      lists: () => [...queryKeys.badges.redemptions.all, 'list'] as const,
    },
  },
} as const;
