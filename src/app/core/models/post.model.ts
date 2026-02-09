export interface Post {
  id: number;
  userId: number;
  authorName: string;
  team: string;
  tags: string[];
  mood: string;
  title?: string;
  body: string;
  isDeleted: boolean;
  createdAt: number;
  updatedAt: number;
}
