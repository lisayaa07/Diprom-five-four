import { Routes, Route, Navigate } from "react-router-dom";
// import Sidebar from "./components/Sidebar";
import Form from "./Form";
import Add from "./Add";
import Calc from "./Calc";
import Search_User from "./components/Search_User";
export default function App() {
  return (
    
        <Routes>
          <Route path="/" element={<Navigate to="/form" replace />} />
          <Route path="/form" element={<Form />} />
          <Route path="/add" element={<Add />} />
          <Route path="/calc" element={<Calc />} />
          <Route path="/search-user" element={<Search_User />} />
        </Routes>
      
  );
}
