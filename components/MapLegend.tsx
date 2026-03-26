export default function MapLegend({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="absolute bottom-6 left-6 z-1000 w-40 bg-white/90 backdrop-blur p-3 rounded-xl border border-black/10 shadow-sm dark:bg-black/80 dark:border-white/10 text-xs pointer-events-none">
      <div className="font-semibold mb-2 opacity-90">Visa Categories</div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[#22c55e] border border-black/10 dark:border-white/10 opacity-80"></div>
          <span className="opacity-80">Visa-Free</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[#eab308] border border-black/10 dark:border-white/10 opacity-80"></div>
          <span className="opacity-80">eVisa</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[#f97316] border border-black/10 dark:border-white/10 opacity-80"></div>
          <span className="opacity-80">Visa on Arrival</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[#ef4444] border border-black/10 dark:border-white/10 opacity-80"></div>
          <span className="opacity-80">Visa Required</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[#6b7280] border border-black/10 dark:border-white/10 opacity-80"></div>
          <span className="opacity-80">No Admission</span>
        </div>
      </div>
    </div>
  );
}
