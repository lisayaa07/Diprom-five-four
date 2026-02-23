import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Form from "./Form";
import Add from "./Add";
import Search_User from "./components/Search_User";
import Order_Detail from "./components/Order_Detail";
import Nav from "./components/Nav";
import AdminLogin from "./AdminLogin";
import RequireRole from "./components/RequireAdmin";
import SuperAdmin from "./SuperAdmin";

export default function App() {
  const location = useLocation();

  // ไม่ให้แสดง nav ตอนอยู่หน้า login
  const hideNav = location.pathname === "/admin/login";

  return (
    <>
      {!hideNav && (
        <div className="fixed top-0 left-0 w-full z-50">
          <Nav />
        </div>
      )}

      {/* ดัน content ลงมา ไม่ให้โดน nav บัง */}
     <div className={!hideNav ? "ml-64 p-8" : ""}>
        <Routes>
          
          <Route path="/" element={<Navigate to="/admin/login" replace />} />

          <Route path="/admin/login" element={<AdminLogin />} />

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

          <Route
            path="/super-admin"
            element={
              <RequireRole allow={["SuperAdmin"]}>
                <SuperAdmin />
              </RequireRole>
            }
          />

          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </div>
    </>
  );
}
