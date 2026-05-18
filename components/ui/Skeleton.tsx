interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className = "", style }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{ background: "var(--gray-200)", ...style }}
    />
  )
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div
      className="rounded-2xl p-5 space-y-3"
      style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}
    >
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-3" style={{ width: `${70 + (i % 3) * 10}%` }} />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}
    >
      {/* Header falso */}
      <div className="flex gap-4 px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3" style={{ flex: 1 }} />
        ))}
      </div>
      {/* Filas */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-5 py-3.5 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-3" style={{ flex: 1, opacity: 1 - i * 0.1 }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-5 space-y-3"
            style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SkeletonCard rows={4} />
        <SkeletonCard rows={3} />
      </div>
    </div>
  )
}
