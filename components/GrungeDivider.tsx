/**
 * Hand-drawn brush-stroke divider, used between homepage sections only —
 * never inside article body/reading surfaces (see plan's design-system rule).
 */
export function GrungeDivider({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 20"
      preserveAspectRatio="none"
      className={`h-3 w-full text-brand-amarillo ${className}`}
      aria-hidden="true"
    >
      <path
        d="M2 12 C 100 4, 200 18, 300 10 S 500 2, 598 12"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
