export function Wordmark({ size = 20 }: { size?: number }) {
  return (
    <div className="inline-flex items-center" style={{ gap: 9 }}>
      <svg width={size + 4} height={size + 4} viewBox="0 0 28 28" fill="none">
        <path d="M3 6 L17 4 L25 14 L11 24 Z" fill="var(--ink)" />
        <circle cx="13" cy="9" r="1.6" fill="var(--paper)" />
      </svg>
      <span
        className="font-display italic"
        style={{ fontSize: size, letterSpacing: "-0.025em", color: "var(--ink)", fontWeight: 500 }}
      >
        pricetag
      </span>
    </div>
  );
}
