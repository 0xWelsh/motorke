import SkeletonBlock from "@/components/ui/SkeletonBlock";

export default function LoadingAdminCars() {
  return (
    <div className="mk-page-shell space-y-5 py-1">
      <SkeletonBlock className="h-36 w-full" />
      <SkeletonBlock className="h-16 w-full" />
      <div className="rounded-xl border border-white/[0.08] bg-[#1c1c1c] p-4">
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, idx) => (
            <SkeletonBlock key={idx} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
