"use client";

import { useState } from "react";
import Link from "next/link";
import { logout } from "@/app/admin/actions";
import styles from "./AdminBar.module.scss";

export default function AdminBar() {
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    await logout(window.location.pathname);
  }

  return (
    <div className={styles.bar}>
      <span className={styles.label}>Admin mode</span>
      <div className={styles.actions}>
        <Link href="/admin">Dashboard</Link>
        <button type="button" onClick={handleLogout} disabled={busy}>
          {busy ? "..." : "Logout"}
        </button>
      </div>
    </div>
  );
}
