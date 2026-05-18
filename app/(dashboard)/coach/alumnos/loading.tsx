import { SkeletonTable } from "@/components/ui/Skeleton"
import { Skeleton } from "@/components/ui/Skeleton"

export default function LoadingAlumnos() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex justify-between">
        <div className="space-y-2"><Skeleton className="h-7 w-36" /><Skeleton className="h-4 w-52" /></div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <SkeletonTable rows={5} cols={5} />
    </div>
  )
}
