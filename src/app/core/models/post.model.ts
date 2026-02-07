export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  team: string;
  tags: string[];
  mood: string;
  title?: string;
  body: string;
  createdAt: number;
  updatedAt: number;
}
