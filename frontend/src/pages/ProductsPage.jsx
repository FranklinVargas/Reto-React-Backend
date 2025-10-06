import { useEffect, useState } from "react";
import Modal from "../components/Modal.jsx";
import { api } from "../api/client.js";
import { formatCurrency } from "../constants.js";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api.get("/products");
      setProducts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openModal = (mode, product = { name: "", unitPrice: 0 }) => {
    setModal({
      mode,
      id: product.id ?? null,
      name: product.name,
      unitPrice: product.unitPrice
    });
  };

  const closeModal = () => setModal(null);

  const saveProduct = async () => {
    if (!modal) return;
    if (!modal.name.trim()) {
      alert("Name is required");
      return;
    }
    const unitPrice = Number(modal.unitPrice);
    if (Number.isNaN(unitPrice) || unitPrice <= 0) {
      alert("Unit price must be greater than zero");
      return;
    }
    try {
      if (modal.mode === "edit" && modal.id) {
        await api.put(`/products/${modal.id}`, { name: modal.name, unitPrice });
      } else {
        await api.post("/products", { name: modal.name, unitPrice });
      }
      closeModal();
      await loadProducts();
    } catch (err) {
      alert(err.message || "Failed to save product");
    }
  };

  const deleteProduct = async (product) => {
    const confirmed = window.confirm(`Delete product ${product.name}?`);
    if (!confirmed) return;
    try {
      await api.delete(`/products/${product.id}`);
      await loadProducts();
    } catch (err) {
      alert(err.message || "Failed to delete product");
    }
  };

  return (
    <section className="card">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Products</h2>
        <button type="button" onClick={() => openModal("create")}>Add product</button>
      </header>

      {loading && <p>Loading products...</p>}
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      {!loading && products.length === 0 && <div className="empty-state">No products available.</div>}

      {!loading && products.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Unit price</th>
                <th>Options</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>{formatCurrency(product.unitPrice)}</td>
                  <td>
                    <div className="actions">
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => openModal("edit", product)}
                      >
                        Edit
                      </button>
                      <button type="button" className="danger" onClick={() => deleteProduct(product)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal
          title={modal.mode === "edit" ? "Edit product" : "Add product"}
          onClose={closeModal}
          actions={
            <button type="button" onClick={saveProduct}>
              Save
            </button>
          }
        >
          <div className="form-field">
            <label htmlFor="productName">Name</label>
            <input
              id="productName"
              value={modal.name}
              onChange={(event) => setModal((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div className="form-field">
            <label htmlFor="productPrice">Unit price</label>
            <input
              id="productPrice"
              type="number"
              min="0"
              step="0.01"
              value={modal.unitPrice}
              onChange={(event) => setModal((prev) => ({ ...prev, unitPrice: event.target.value }))}
            />
          </div>
        </Modal>
      )}
    </section>
  );
}
