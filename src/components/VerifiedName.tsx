import { BadgeCheck } from "lucide-react";

/* Real blue verification badge — the classic solid-blue seal with a
   white check, rendered inline right after a verified name.
   The colour is a literal hex (#1D9BF0, the X/Twitter verified blue)
   passed as SVG props, NOT a Tailwind sky class: this site's
   tailwind.config aliases sky blue to gold, so any sky-* class would
   render gold. fill paints the seal solid blue; stroke paints the
   check (and the seal's edge) white. */
export const VERIFIED_BLUE = "#1D9BF0";

export function VerifiedName({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap ${className}`}>
      <span>{name}</span>
      <BadgeCheck
        aria-hidden="true"
        className="h-[1.1em] w-[1.1em] shrink-0"
        fill={VERIFIED_BLUE}
        stroke="#ffffff"
        strokeWidth={2.5}
      />
    </span>
  );
}
