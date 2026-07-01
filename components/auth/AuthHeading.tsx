export function AuthHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className="mb-7 space-y-2 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm leading-7 text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
