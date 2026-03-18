// src/app/portal/loading.js
export default function PortalLoading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="flex justify-between items-center mb-8">
        <div className="h-9 w-40 bg-white/5 rounded-lg" />
        <div className="h-10 w-28 bg-white/5 rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[1,2,3].map((i) => (
          <div key={i} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 h-20" />
        ))}
      </div>
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl h-80" />
    </div>
  );
}
