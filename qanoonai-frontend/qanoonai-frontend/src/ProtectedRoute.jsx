import { Navigate } from "react-router-dom";

// Yeh component check karta hai: user logged in hai ya nahi?
// Agar nahi, toh login page pe bhej deta hai
// Agar galat role hai, toh bhi redirect karta hai

export default function ProtectedRoute({ children, allowedRole }) {
  // localStorage se user data lo
  const userStr = localStorage.getItem("user");
  
  // Agar user nahi hai, toh login page pe bhejo
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }
  
  const user = JSON.parse(userStr);
  
  // Agar specific role chahiye aur match nahi karta, toh user ke correct dashboard pe bhejo
  if (allowedRole && user.role !== allowedRole) {
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "lawyer") return <Navigate to="/lawyer" replace />;
    if (user.role === "customer") return <Navigate to="/customer" replace />;
    return <Navigate to="/login" replace />;
  }
  
  // Sab theek hai, page dikhao
  return children;
}
