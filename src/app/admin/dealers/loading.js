import SkeletonBlock from "@/components/ui/SkeletonBlock";

export default function LoadingAdminDealers() {
  return (
    <div className="mk-page-shell space-y-5 py-1">
      <SkeletonBlock className="h-36 w-full" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <SkeletonBlock key={idx} className="h-56 w-full" />
        ))}
      </div>
    </div>
  );
}
