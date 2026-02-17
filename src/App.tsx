import { Routes, Route, Navigate } from "react-router-dom";
import Form from "./Form";
import Add from "./Add";
import Search_User from "./components/Search_User";
import Order_Detail from "./components/Order_Detail";

import AdminLogin from "./AdminLogin";
import RequireRole from "./components/RequireAdmin";
import SuperAdmin from "./SuperAdmin";

export default function App() {
  return (
    <Routes>
      {/* ✅ เปิดมาปุ๊บไป login ก่อน */}
      <Route path="/" element={<Navigate to="/admin/login" replace />} />

      <Route path="/admin/login" element={<AdminLogin />} />

      {/* ✅ Admin ใช้งานหน้าหลักได้ (SuperAdmin ก็เข้าได้) */}
      <Route
        path="/form"
        element={
          <RequireRole allow={["Admin", "SuperAdmin"]}>
            <Form />
          </RequireRole>
        }
      />
      <Route
        path="/add"
        element={
          <RequireRole allow={["Admin", "SuperAdmin"]}>
            <Add />
          </RequireRole>
        }
      />
      <Route
        path="/search-user"
        element={
          <RequireRole allow={["Admin", "SuperAdmin"]}>
            <Search_User />
          </RequireRole>
        }
      />
      <Route
        path="/order/:orderId"
        element={
          <RequireRole allow={["Admin", "SuperAdmin"]}>
            <Order_Detail />
          </RequireRole>
        }
      />

      {/* ✅ เฉพาะ SuperAdmin */}
      <Route
        path="/super-admin"
        element={
          <RequireRole allow={["SuperAdmin"]}>
            <SuperAdmin />
          </RequireRole>
        }
      />

      {/* เผื่อพิมพ์ path แปลก */}
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}
