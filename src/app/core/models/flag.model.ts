export interface Flag {
  id?: number;
  userId: number;
  postId: number;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt?: number;
}
