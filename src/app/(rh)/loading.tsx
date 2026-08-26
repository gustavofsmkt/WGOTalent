export default function RhLoading() {
  return (
    <div className="p-4 sm:p-4 lg:p-4 max-w-7xl mx-auto w-full space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-md bg-muted" />
      <div className="h-6 w-72 rounded-md bg-muted" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-muted" />
    </div>
  );
}
