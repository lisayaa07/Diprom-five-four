// src/components/RequireRole.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getRole, isLoggedIn } from "../lib/Auth";

export default function RequireAdmin({
  allow,
  children,
}: {
  allow: Array<"Admin" | "SuperAdmin">;
  children: React.ReactNode;
}) {
  const loc = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to="/admin/login" replace state={{ from: loc.pathname }} />;
  }

  const role = getRole();
  if (!allow.includes(role as any)) {
    // ถ้า login แล้วแต่ role ไม่ถึง → ส่งไปหน้าที่เหมาะกับ role
    return <Navigate to={role === "SuperAdmin" ? "/super-admin" : "/form"} replace />;
  }

  return <>{children}</>;
}
