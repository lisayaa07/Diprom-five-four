import { Routes, Route, Navigate } from "react-router-dom";
// import Sidebar from "./components/Sidebar";
import Form from "./Form";
import Add from "./Add";
import Calc from "./Calc";
import Search_User from "./components/Search_User";
import Order_Detail from "./components/Order_Detail";
export default function App() {
  return (
    
        <Routes>
          <Route path="/" element={<Navigate to="/form" replace />} />
          <Route path="/form" element={<Form />} />
          <Route path="/add" element={<Add />} />
          <Route path="/calc" element={<Calc />} />
          <Route path="/search-user" element={<Search_User />} />
          <Route path="/order/:orderId" element={<Order_Detail />} />
        </Routes>
      
  );
}
