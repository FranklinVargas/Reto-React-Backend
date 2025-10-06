import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import OrdersPage from "./pages/OrdersPage.jsx";
import OrderFormPage from "./pages/OrderFormPage.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Technical Test - Orders Management</h1>
        <nav>
          <NavLink to="/my-orders" className={({ isActive }) => (isActive ? "active" : "")}>Orders</NavLink>
          <NavLink to="/products" className={({ isActive }) => (isActive ? "active" : "")}>Products</NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/my-orders" element={<OrdersPage />} />
          <Route path="/add-order" element={<OrderFormPage />} />
          <Route path="/add-order/:id" element={<OrderFormPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="*" element={<Navigate to="/my-orders" replace />} />
        </Routes>
      </main>
    </div>
  );
}
