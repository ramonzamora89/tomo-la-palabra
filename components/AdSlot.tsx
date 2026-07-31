type AdSlotType = "leaderboard" | "rectangle" | "in-article";

const SIZES: Record<AdSlotType, string> = {
  leaderboard: "min-h-[90px] w-full max-w-[728px]",
  rectangle: "min-h-[250px] w-full max-w-[300px]",
  "in-article": "min-h-[250px] w-full",
};

/**
 * Every ad placement in the codebase goes through this component instead of
 * embedding a provider's markup directly. The wrapper reserves a fixed
 * aspect ratio regardless of provider (prevents layout shift), and the
 * provider itself is chosen by NEXT_PUBLIC_AD_PROVIDER so a future local/
 * direct-sold rotator can be swapped in later without touching any page.
 */
export function AdSlot({ id, type }: { id: string; type: AdSlotType }) {
  const provider = process.env.NEXT_PUBLIC_AD_PROVIDER ?? "adsense";

  return (
    <div
      data-ad-slot-id={id}
      className={`mx-auto flex items-center justify-center border border-dashed border-ink-300 bg-ink-50 text-xs text-ink-600 ${SIZES[type]}`}
    >
      {provider === "adsense" ? (
        <ins
          className="adsbygoogle block w-full"
          style={{ display: "block" }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
          data-ad-slot={id}
          data-ad-format={type === "in-article" ? "fluid" : "auto"}
          data-full-width-responsive="true"
        />
      ) : (
        // Placeholder for a future <LocalSponsorRotator slotId={id} />.
        <span>espacio publicitario</span>
      )}
    </div>
  );
}
