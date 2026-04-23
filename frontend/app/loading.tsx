export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-1 w-full overflow-hidden bg-slate-200">
        <div className="h-full w-1/3 animate-pulse rounded-r-full bg-sky-500" />
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8">
        <div className="h-14 rounded-2xl bg-white shadow-sm" />
        <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
          <div className="hidden h-[70vh] rounded-3xl bg-white shadow-sm lg:block" />
          <div className="space-y-6">
            <div className="h-40 rounded-3xl bg-white shadow-sm" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-48 rounded-2xl bg-white shadow-sm" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
