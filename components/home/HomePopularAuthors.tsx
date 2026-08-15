import Link from "next/link";
import { Users } from "lucide-react";

import AuthorAvatar from "@/components/reference/AuthorAvatar";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import { Carousel } from "@/components/ui/Carousel";

interface PopularAuthor {
  id: string;
  name: string;
  slug: string | null;
  coverImage: string | null;
  bookCount: number;
  readCount: number;
}

function AuthorCard({ author }: { author: PopularAuthor }) {
  const href = `/authors/${encodeURIComponent(author.slug ?? author.name)}`;

  return (
    <Link
      href={href}
      className="group flex flex-col items-center text-center rounded-[1.5rem] border border-border/70 bg-card/70 p-4 transition-all hover:-translate-y-0.5  hover:border-primary/25 hover:bg-card/85 shadow-sm"
    >
      <div className="relative">
        <div className="pointer-events-none absolute -inset-2 rounded-full bg-primary/10 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />
        <div className="relative rounded-full p-1 transition-transform duration-300 group-hover:-translate-y-0.5">
          <AuthorAvatar
            name={author.name}
            image={author.coverImage}
            sizeClassName="h-24 w-24 sm:h-28 sm:w-28"
          />
        </div>
      </div>

      <h3 className="mt-3 line-clamp-1 max-w-full font-black text-sm text-foreground/90 transition-colors duration-200 group-hover:text-primary">
        {author.name}
      </h3>
    </Link>
  );
}

export default function HomePopularAuthors({
  authors,
}: {
  authors: PopularAuthor[];
}) {
  if (!authors.length) return null;
  return (
    <section className="relative">
      <div className="mb-4 sm:mb-5">
        <HomeSectionHeader
          icon={Users}
          title="نویسنده های منتخب"
          href="/authors"
        />
      </div>

      <Carousel
        ariaLabel="نویسندگان محبوب"
        slideClassName="basis-[135px] py-4 sm:basis-[170px] lg:basis-[190px]"
        containerClassName="gap-4"
        slides={authors.map((author) => (
          <AuthorCard key={author.id} author={author} />
        ))}
      />
    </section>
  );
}
