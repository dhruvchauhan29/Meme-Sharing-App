export interface Flag {
  id: string;
  userId: string;
  postId: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt: number;
}
