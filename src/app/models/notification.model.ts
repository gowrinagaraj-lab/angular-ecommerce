export interface Notification {
  _id: string;
  user: string;
  title: string;
  message: string;
  type: 'system' | 'order' | 'payment' | 'promotion';
  isRead: boolean;
  link?: string;
  metadata?: any;
  createdAt: string;
  readAt?: string;
}

export interface NotificationApiResponse {
  success: boolean;
  total?: number;
  page?: number;
  totalPages?: number;
  data: Notification | Notification[];
  message?: string;
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}
