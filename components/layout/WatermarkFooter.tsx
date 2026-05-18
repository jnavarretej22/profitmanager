export function WatermarkFooter() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center py-1.5 pointer-events-none select-none"
      style={{
        background: "var(--background-card)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <p
        className="text-xs font-medium tracking-wide"
        style={{ color: "var(--foreground-subtle)" }}
      >
        Powered by{" "}
        <span style={{ color: "var(--foreground-muted)", fontWeight: 600 }}>
          ProFit Manager
        </span>
      </p>
    </div>
  )
}
