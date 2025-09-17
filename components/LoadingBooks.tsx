"use client";

export default function LoadingBooks() {
  return (
    <div className="flex flex-col justify-center items-center h-full min-h-[300px]">
      {/* حلقه چرخشی */}
      <div className="relative w-20 h-20 animate-spin-slow">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-12 bg-primary rounded shadow-lg"></div>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 rotate-45 w-4 h-12 bg-primary rounded shadow-lg"></div>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 rotate-90 w-4 h-12 bg-primary rounded shadow-lg"></div>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 rotate-[135deg] w-4 h-12 bg-primary rounded shadow-lg"></div>
      </div>
      {/* متن لودینگ */}
      <p className="mt-6 text-gray-200 text-lg animate-pulse">
        در حال بارگذاری...
      </p>
    </div>
  );
}
