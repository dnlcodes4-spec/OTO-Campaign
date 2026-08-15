export default function Loading() {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Loading gallery"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="aspect-[4/5] animate-pulse bg-ink/10 sm:aspect-square" />
      ))}
    </div>
  );
}
