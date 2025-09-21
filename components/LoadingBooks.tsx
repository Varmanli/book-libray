"use client";

import { BookLoading } from "./Loading";

interface LoadingBooksProps {
  message?: string;
}

export default function LoadingBooks({ message = "در حال بارگذاری کتاب‌ها..." }: LoadingBooksProps) {
  return <BookLoading text={message} />;
}
