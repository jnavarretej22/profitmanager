import { SkeletonTable } from "@/components/ui/Skeleton"
import { Skeleton } from "@/components/ui/Skeleton"

export default function LoadingAdmin() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1,2,3,4].map((i) => (
          <div key={i} className="rounded-2xl p-5" style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-14" />
          </div>
        ))}
      </div>
      <SkeletonTable rows={6} cols={5} />
    </div>
  )
}
