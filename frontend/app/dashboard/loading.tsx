import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header skeleton */}
      <div style={{
        height: 68, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(20px, 5vw, 52px)",
        borderBottom: "1px solid var(--cream-line)",
        background: "rgba(255,255,255,0.88)",
      }}>
        <Skeleton width={220} height={32} />
        <Skeleton width={100} height={32} borderRadius={999} />
      </div>

      {/* Main content skeleton */}
      <div style={{
        flex: 1, width: "100%", maxWidth: 1080, margin: "0 auto",
        padding: "clamp(20px, 3vw, 28px)",
        display: "flex", flexDirection: "column", gap: 20,
      }}>
        {/* Wallet bar */}
        <Skeleton width="100%" height={56} borderRadius={12} />

        {/* Balance card */}
        <div style={{
          borderRadius: 20, padding: "clamp(24px, 3vw, 32px)",
          background: "linear-gradient(150deg, #1a2e26 0%, #14251d 55%, #0f1f18 100%)",
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          <Skeleton width={100} height={14} />
          <Skeleton width={200} height={48} />
          <Skeleton width={300} height={12} />
        </div>

        {/* Form grid skeletons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton width={120} height={12} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            <Skeleton width="100%" height={280} borderRadius={20} />
            <Skeleton width="100%" height={280} borderRadius={20} />
            <Skeleton width="100%" height={280} borderRadius={20} />
          </div>
        </div>
      </div>
    </div>
  );
}
