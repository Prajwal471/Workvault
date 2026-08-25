"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { useRole } from "@/context/RoleContext";

export default function DashboardPage() {
  const { wallet, walletReady } = useWallet();
  const { role, roleReady } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (walletReady && !wallet) {
      router.replace("/");
    } else if (roleReady && role) {
      router.replace(`/dashboard/${role}`);
    } else if (roleReady && !role) {
      router.replace("/dashboard/select-role");
    }
  }, [walletReady, wallet, roleReady, role, router]);

  return null;
}
