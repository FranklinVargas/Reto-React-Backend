import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Modal from "../components/Modal.jsx";
import { api } from "../api/client.js";
import { formatCurrency, formatDate } from "../constants.js";

const emptyItem = { productId: "", qty: 1 };

export default function OrderFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [orderNumber, setOrderNumber] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString());
  const [orderStatus, setOrderStatus] = useState("Pending");
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [productModal, setProductModal] = useState(null);

  const isCompleted = orderStatus === "Completed";

  const totals = useMemo(() => {
    const productsCount = items.reduce((acc, item) => acc + Number(item.qty || 0), 0);
    const finalPrice = items.reduce((acc, item) => acc + Number(item.totalPrice || 0), 0);
    return { productsCount, finalPrice };
  }, [items]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [productsResponse, orderResponse] = await Promise.all([
          api.get("/products"),
          isEditing ? api.get(`/orders/${id}`) : Promise.resolve(null)
        ]);

        setProducts(productsResponse);

        if (orderResponse) {
          setOrderNumber(orderResponse.orderNumber);
          setOrderDate(orderResponse.date);
          setOrderStatus(orderResponse.status);
          setItems(
            (orderResponse.OrderItems || []).map((item) => ({
              productId: item.productId,
              productName: item.Product?.name || "",
              unitPrice: Number(item.unitPrice),
              qty: item.qty,
              totalPrice: Number(item.totalPrice)
            }))
          );
        } else {
          setOrderDate(new Date().toISOString());
          setOrderNumber(`ORD-${Date.now()}`);
          setOrderStatus("Pending");
          setItems([]);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load resources");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id, isEditing]);

  const openProductModal = (mode, initialItem = emptyItem, index = null) => {
    const defaultProductId = initialItem.productId || (products[0]?.id ?? "");
    setProductModal({
      mode,
      index,
      productId: defaultProductId ? String(defaultProductId) : "",
      qty: initialItem.qty || 1
    });
  };

  const closeProductModal = () => setProductModal(null);

  const handleSaveProduct = () => {
    if (!productModal) return;
    const product = products.find((p) => p.id === Number(productModal.productId));
    if (!product) {
      alert("Please select a product");
      return;
    }
    const qty = Number(productModal.qty);
    if (!Number.isInteger(qty) || qty <= 0) {
      alert("Quantity must be a positive integer");
      return;
    }

    const itemData = {
      productId: product.id,
      productName: product.name,
      unitPrice: Number(product.unitPrice),
      qty,
      totalPrice: Number(product.unitPrice) * qty
    };

    setItems((prev) => {
      if (productModal.mode === "edit" && productModal.index !== null) {
        const updated = [...prev];
        updated[productModal.index] = itemData;
        return updated;
      }
      return [...prev, itemData];
    });

    closeProductModal();
  };

  const removeItem = (index) => {
    if (isCompleted) return;
    const confirmed = window.confirm("Remove product from order?");
    if (!confirmed) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (items.length === 0) {
      alert("Please add at least one product to the order");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        orderNumber,
        items: items.map((item) => ({ productId: item.productId, qty: item.qty }))
      };

      if (isEditing) {
        await api.put(`/orders/${id}`, payload);
      } else {
        await api.post("/orders", payload);
      }

      navigate("/my-orders");
    } catch (err) {
      alert(err.message || "Failed to save order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>{isEditing ? "Edit Order" : "Add Order"}</h2>
        <button className="secondary" type="button" onClick={() => navigate(-1)}>
          Back
        </button>
      </header>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      {!loading && (
        <form onSubmit={handleSubmit}>
          {isCompleted && (
            <p style={{ color: "#92400e", background: "#fef3c7", padding: "0.75rem", borderRadius: "6px" }}>
              Completed orders cannot be edited. You can only view the details.
            </p>
          )}

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="orderNumber">Order #</label>
              <input
                id="orderNumber"
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value)}
                required
                disabled={isCompleted}
              />
            </div>
            <div className="form-field">
              <label htmlFor="orderDate">Date</label>
              <input
                id="orderDate"
                value={new Date(orderDate).toISOString().slice(0, 16)}
                type="datetime-local"
                disabled
              />
              <small style={{ color: "#6b7280" }}>Display: {formatDate(orderDate)}</small>
            </div>
            <div className="form-field">
              <label>Status</label>
              <input value={orderStatus} disabled readOnly />
            </div>
            <div className="form-field">
              <label># Products</label>
              <input value={totals.productsCount} disabled readOnly />
            </div>
            <div className="form-field">
              <label>Final Price</label>
              <input value={formatCurrency(totals.finalPrice)} disabled readOnly />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3>Products</h3>
            <button type="button" onClick={() => openProductModal("add")} disabled={isCompleted}>
              Add product
            </button>
          </div>

          {items.length === 0 ? (
            <div className="empty-state">No products added yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Unit price</th>
                    <th>Qty</th>
                    <th>Total price</th>
                    <th>Options</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={`${item.productId}-${index}`}>
                      <td>{item.productId}</td>
                      <td>{item.productName}</td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td>{item.qty}</td>
                      <td>{formatCurrency(item.totalPrice)}</td>
                      <td>
                        <div className="actions">
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => openProductModal("edit", item, index)}
                            disabled={isCompleted}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => removeItem(index)}
                            disabled={isCompleted}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            <button type="button" className="secondary" onClick={() => navigate("/my-orders")}>Cancel</button>
            <button type="submit" disabled={saving || isCompleted}>
              {isEditing ? "Update order" : "Create order"}
            </button>
          </div>
        </form>
      )}

      {productModal && (
        <Modal
          title={productModal.mode === "edit" ? "Edit product" : "Add product"}
          onClose={closeProductModal}
          actions={
            <button type="button" onClick={handleSaveProduct}>
              Save
            </button>
          }
        >
          <div className="form-field">
            <label htmlFor="productSelect">Product</label>
            <select
              id="productSelect"
              value={productModal.productId}
              onChange={(event) => setProductModal((prev) => ({ ...prev, productId: event.target.value }))}
            >
              <option value="" disabled>
                Select a product
              </option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} — {formatCurrency(product.unitPrice)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="productQty">Quantity</label>
            <input
              id="productQty"
              type="number"
              min={1}
              value={productModal.qty}
              onChange={(event) => setProductModal((prev) => ({ ...prev, qty: event.target.value }))}
            />
          </div>
        </Modal>
      )}
    </section>
  );
}
