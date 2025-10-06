import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal.jsx";
import { api } from "../api/client.js";
import { ORDER_STATUSES, formatCurrency, formatDate } from "../constants.js";

const STATUS_LABEL = {
  Pending: "Pending",
  InProgress: "In Progress",
  Completed: "Completed"
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusModal, setStatusModal] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await api.get("/orders");
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleDelete = async (order) => {
    if (order.status === "Completed") return;
    const confirmed = window.confirm(`Delete order ${order.orderNumber}?`);
    if (!confirmed) return;
    try {
      await api.delete(`/orders/${order.id}`);
      await loadOrders();
    } catch (err) {
      alert(err.message || "Failed to delete order");
    }
  };

  const openStatusModal = (order) => {
    setStatusModal({ order, status: order.status });
  };

  const updateStatus = async () => {
    if (!statusModal) return;
    try {
      await api.patch(`/orders/${statusModal.order.id}/status`, { status: statusModal.status });
      setStatusModal(null);
      await loadOrders();
    } catch (err) {
      alert(err.message || "Failed to update status");
    }
  };

  const totalSummary = useMemo(() => {
    const totalOrders = orders.length;
    const totalAmount = orders.reduce((acc, ord) => acc + Number(ord.finalPrice || 0), 0);
    const completed = orders.filter((ord) => ord.status === "Completed").length;
    return { totalOrders, totalAmount, completed };
  }, [orders]);

  return (
    <section className="card">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>My Orders</h2>
          <p style={{ margin: 0, color: "#6b7280" }}>
            {totalSummary.totalOrders} orders • {totalSummary.completed} completed • Total {formatCurrency(totalSummary.totalAmount)}
          </p>
        </div>
        <button onClick={() => navigate("/add-order")}>Add order</button>
      </header>

      {loading && <p>Loading orders...</p>}
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      {!loading && orders.length === 0 && <div className="empty-state">No orders yet. Create your first order.</div>}

      {!loading && orders.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Order #</th>
                <th>Status</th>
                <th>Date</th>
                <th># Products</th>
                <th>Final price</th>
                <th>Options</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.orderNumber}</td>
                  <td>
                    <span className={`badge ${order.status}`}>{STATUS_LABEL[order.status]}</span>
                  </td>
                  <td>{formatDate(order.date)}</td>
                  <td>{order.productsCount}</td>
                  <td>{formatCurrency(order.finalPrice)}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="secondary"
                        onClick={() => navigate(`/add-order/${order.id}`)}
                        disabled={order.status === "Completed"}
                      >
                        Edit
                      </button>
                      <button
                        className="danger"
                        onClick={() => handleDelete(order)}
                        disabled={order.status === "Completed"}
                      >
                        Delete
                      </button>
                      <button onClick={() => openStatusModal(order)} disabled={order.status === "Completed"}>
                        Change status
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {statusModal && (
        <Modal
          title={`Update status for ${statusModal.order.orderNumber}`}
          onClose={() => setStatusModal(null)}
          actions={
            <button type="button" onClick={updateStatus}>
              Save
            </button>
          }
        >
          <div className="form-field">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={statusModal.status}
              onChange={(event) => setStatusModal((prev) => ({ ...prev, status: event.target.value }))}
            >
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </div>
        </Modal>
      )}
    </section>
  );
}
