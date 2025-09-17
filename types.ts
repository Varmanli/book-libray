export type BookType = {
  id: string;
  title: string;
  coverImage: string;
  author: string;
  translator?: string | null;
  description?: string | null;
  country?: string | null;
  genre: string;
  pageCount?: number | null;
  format: "PHYSICAL" | "ELECTRONIC";
  publisher?: string | null;
  createdAt: string;
  userId: string;
  status: "UNREAD" | "READING" | "FINISHED";
  progress?: number | null;
  rating?: number | null;
  review?: string | null;
  quotes?: QuoteType[];
};

export type QuoteType = {
  id: string;
  content: string;
  page?: number | null;
  bookId: string;
};
