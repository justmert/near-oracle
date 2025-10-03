'use client';

export function LiveIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </div>
      <span className="font-medium">Live · Updates every 10s</span>
    </div>
  );
}
