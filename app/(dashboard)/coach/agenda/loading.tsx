import { SkeletonCard } from "@/components/ui/Skeleton"
import { Skeleton } from "@/components/ui/Skeleton"

export default function LoadingAgenda() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex justify-between">
        <div className="space-y-2"><Skeleton className="h-7 w-32" /><Skeleton className="h-4 w-48" /></div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <div className="space-y-3">
        {[1,2,3].map((i) => <SkeletonCard key={i} rows={2} />)}
      </div>
    </div>
  )
}
