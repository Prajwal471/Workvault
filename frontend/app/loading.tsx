import { Skeleton } from "@/components/ui/Skeleton";

export default function LandingLoading() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      {/* Header skeleton */}
      <div style={{
        height: 68, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(20px, 5vw, 52px)",
        borderBottom: "1px solid var(--cream-line)",
        background: "rgba(255,255,255,0.88)",
      }}>
        <Skeleton width={200} height={32} />
        <Skeleton width={140} height={40} borderRadius={10} />
      </div>

      {/* Hero skeleton */}
      <div style={{
        padding: "clamp(36px, 6vw, 72px) 24px",
        maxWidth: 1120, margin: "0 auto", width: "100%",
        display: "flex", gap: 64, flexWrap: "wrap", alignItems: "center",
      }}>
        <div style={{ flex: "1 1 400px", display: "flex", flexDirection: "column", gap: 20 }}>
          <Skeleton width="90%" height={48} />
          <Skeleton width="70%" height={48} />
          <Skeleton width="100%" height={18} />
          <Skeleton width="100%" height={18} />
          <Skeleton width="80%" height={18} />
          <Skeleton width={180} height={48} borderRadius={10} />
        </div>
        <div style={{ flex: "1 1 300px", display: "flex", justifyContent: "center" }}>
          <Skeleton width={320} height={200} borderRadius={20} />
        </div>
      </div>
    </div>
  );
}
