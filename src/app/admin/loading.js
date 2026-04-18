// src/app/admin/loading.js
export default function AdminLoading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="h-9 w-48 bg-white/5 rounded-2xl mb-8" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[1,2,3,4].map((i) => (
          <div key={i} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl h-72" />
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl h-72" />
      </div>
    </div>
  );
}
