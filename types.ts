export type BookType = {
  status: "UNREAD" | "READING" | "FINISHED";
  id: string;
  title: string;
  author: string;
  translator?: string | null;
  genre: string;
  format: string;
  coverImage: string;
  createdAt: string;
  progress?: number | null;
  rating?: number | null;
  review?: string | null;
  country?: string | null;
  publisher?: string | null;
};
