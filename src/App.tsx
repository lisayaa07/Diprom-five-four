import { Routes, Route, Navigate } from "react-router-dom";
// import Sidebar from "./components/Sidebar";
import Form from "./Form";
import Add from "./Add";
import Calc from "./Calc";

export default function App() {
  return (
    
        <Routes>
          <Route path="/" element={<Navigate to="/form" replace />} />
          <Route path="/form" element={<Form />} />
          <Route path="/add" element={<Add />} />
          <Route path="/calc" element={<Calc />} />
        </Routes>
      
  );
}
