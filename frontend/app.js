const API_BASE_URL = (window.API_BASE_URL ?? "http://localhost:4000/api").replace(/\/$/, "");

const ORDER_STATUS = [
  { value: "Pending", label: "Pendiente" },
  { value: "InProgress", label: "En progreso" },
  { value: "Completed", label: "Completado" },
];

const STATUS_CLASS = {
  Pending: "badge pending",
  InProgress: "badge inprogress",
  Completed: "badge completed",
};

const state = {
  products: [],
  orders: [],
  orderItems: [{ productId: "", qty: 1 }],
};

const els = {
  error: document.getElementById("global-error"),
  loading: document.getElementById("loading"),
  content: document.getElementById("content"),
  productList: document.getElementById("product-list"),
  productForm: document.getElementById("product-form"),
  orderList: document.getElementById("order-list"),
  orderForm: document.getElementById("order-form"),
  orderItems: document.getElementById("order-items"),
  addOrderItem: document.getElementById("add-order-item"),
  orderSummary: document.getElementById("order-summary"),
};

function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value ?? 0));
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    data = text;
  }

  if (!response.ok) {
    throw new Error(data?.message ?? response.statusText);
  }

  return data;
}

function setError(message) {
  if (message) {
    els.error.textContent = message;
    els.error.classList.remove("hidden");
  } else {
    els.error.textContent = "";
    els.error.classList.add("hidden");
  }
}

function setLoading(isLoading) {
  if (isLoading) {
    els.loading.classList.remove("hidden");
    els.content.classList.add("hidden");
  } else {
    els.loading.classList.add("hidden");
    els.content.classList.remove("hidden");
  }
}

function renderProducts() {
  els.productList.innerHTML = "";
  if (!state.products.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Aún no hay productos registrados.";
    els.productList.appendChild(empty);
    return;
  }

  state.products
    .slice()
    .sort((a, b) => a.id - b.id)
    .forEach((product) => {
      const item = document.createElement("div");
      item.className = "list-item";

      const info = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = product.name;
      const price = document.createElement("div");
      price.className = "muted";
      price.textContent = formatCurrency(product.unitPrice);
      info.appendChild(name);
      info.appendChild(price);

      const removeBtn = document.createElement("button");
      removeBtn.className = "danger";
      removeBtn.type = "button";
      removeBtn.textContent = "Eliminar";
      removeBtn.addEventListener("click", async () => {
        if (!window.confirm("¿Eliminar este producto?")) return;
        try {
          setError(null);
          await apiFetch(`/products/${product.id}`, { method: "DELETE" });
          state.products = state.products.filter((p) => p.id !== product.id);
          state.orderItems = state.orderItems.map((item) =>
            item.productId === String(product.id)
              ? { ...item, productId: "" }
              : item
          );
          renderProducts();
          renderOrderItems();
          renderOrders();
        } catch (error) {
          setError(error.message);
        }
      });

      item.appendChild(info);
      item.appendChild(removeBtn);
      els.productList.appendChild(item);
    });
}

function renderOrderSummary() {
  const summary = state.orderItems.reduce(
    (acc, item) => {
      const product = state.products.find((p) => p.id === Number(item.productId));
      const qty = Number(item.qty) || 0;
      if (!product || !qty) return acc;
      const unitPrice = Number(product.unitPrice);
      return {
        totalItems: acc.totalItems + qty,
        totalPrice: acc.totalPrice + unitPrice * qty,
      };
    },
    { totalItems: 0, totalPrice: 0 }
  );

  els.orderSummary.innerHTML = "";
  const itemsSpan = document.createElement("span");
  itemsSpan.textContent = `${summary.totalItems} artículos`;
  const priceSpan = document.createElement("span");
  priceSpan.textContent = formatCurrency(summary.totalPrice);
  els.orderSummary.append(itemsSpan, priceSpan);
}

function renderOrderItems() {
  els.orderItems.innerHTML = "";
  if (!state.orderItems.length) {
    state.orderItems.push({ productId: "", qty: 1 });
  }

  state.orderItems.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "order-item-row";

    const select = document.createElement("select");
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Selecciona un producto";
    select.appendChild(defaultOption);

    state.products
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((product) => {
        const option = document.createElement("option");
        option.value = product.id;
        option.textContent = product.name;
        if (String(product.id) === String(item.productId)) option.selected = true;
        select.appendChild(option);
      });

    select.addEventListener("change", (event) => {
      state.orderItems[index].productId = event.target.value;
      renderOrderSummary();
    });

    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.min = "1";
    qtyInput.value = item.qty;
    qtyInput.addEventListener("change", (event) => {
      const value = Math.max(1, Number(event.target.value) || 1);
      state.orderItems[index].qty = value;
      event.target.value = value;
      renderOrderSummary();
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "danger";
    removeBtn.textContent = "Quitar";
    removeBtn.disabled = state.orderItems.length === 1;
    removeBtn.addEventListener("click", () => {
      if (state.orderItems.length === 1) return;
      state.orderItems.splice(index, 1);
      renderOrderItems();
      renderOrderSummary();
    });

    row.append(select, qtyInput, removeBtn);
    els.orderItems.appendChild(row);
  });

  renderOrderSummary();
}

function orderItemsLabel(order) {
  if (!order?.OrderItems?.length) return "Sin productos";
  return order.OrderItems.map((item) => {
    const product = state.products.find((p) => p.id === item.productId);
    const productName = product?.name ?? `Producto #${item.productId}`;
    return `${item.qty} x ${productName}`;
  }).join(" · ");
}

function renderOrders() {
  els.orderList.innerHTML = "";
  if (!state.orders.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Aún no hay pedidos registrados.";
    els.orderList.appendChild(empty);
    return;
  }

  state.orders
    .slice()
    .sort((a, b) => a.id - b.id)
    .forEach((order) => {
      const item = document.createElement("div");
      item.className = "list-item";

      const info = document.createElement("div");
      info.style.flex = "1";

      const title = document.createElement("strong");
      title.textContent = order.orderNumber;
      const meta = document.createElement("div");
      meta.className = "muted";
      meta.textContent = `${order.productsCount} artículos · ${formatCurrency(order.finalPrice)}`;
      const details = document.createElement("small");
      details.textContent = orderItemsLabel(order);

      info.append(title, meta, details);

      const actions = document.createElement("div");
      actions.className = "order-actions";

      const badge = document.createElement("span");
      badge.className = STATUS_CLASS[order.status] ?? "badge";
      badge.textContent = order.status;

      const select = document.createElement("select");
      ORDER_STATUS.forEach((status) => {
        const option = document.createElement("option");
        option.value = status.value;
        option.textContent = status.label;
        if (status.value === order.status) option.selected = true;
        select.appendChild(option);
      });
      select.addEventListener("change", async (event) => {
        try {
          setError(null);
          const updated = await apiFetch(`/orders/${order.id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status: event.target.value }),
          });
          order.status = updated.status;
          badge.className = STATUS_CLASS[order.status] ?? "badge";
          badge.textContent = order.status;
        } catch (error) {
          setError(error.message);
          select.value = order.status;
        }
      });

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "danger";
      removeBtn.textContent = "Eliminar";
      removeBtn.addEventListener("click", async () => {
        if (!window.confirm("¿Eliminar este pedido?")) return;
        try {
          setError(null);
          await apiFetch(`/orders/${order.id}`, { method: "DELETE" });
          state.orders = state.orders.filter((it) => it.id !== order.id);
          renderOrders();
        } catch (error) {
          setError(error.message);
        }
      });

      actions.append(badge, select, removeBtn);
      item.append(info, actions);
      els.orderList.appendChild(item);
    });
}

async function loadInitialData() {
  try {
    setLoading(true);
    setError(null);
    const [products, orders] = await Promise.all([
      apiFetch("/products"),
      apiFetch("/orders"),
    ]);
    state.products = products;
    state.orders = orders;
    renderProducts();
    renderOrderItems();
    renderOrders();
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
}

els.productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const name = formData.get("name").trim();
  const unitPrice = Number(formData.get("unitPrice"));

  if (!name) return setError("El nombre es obligatorio");
  if (!unitPrice || unitPrice <= 0) return setError("El precio debe ser mayor a 0");

  try {
    setError(null);
    const created = await apiFetch("/products", {
      method: "POST",
      body: JSON.stringify({ name, unitPrice }),
    });
    state.products.push(created);
    event.currentTarget.reset();
    renderProducts();
    renderOrderItems();
  } catch (error) {
    setError(error.message);
  }
});

els.addOrderItem.addEventListener("click", () => {
  state.orderItems.push({ productId: "", qty: 1 });
  renderOrderItems();
});

els.orderForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const orderNumber = formData.get("orderNumber").trim();
  const items = state.orderItems
    .map((item) => ({
      productId: Number(item.productId),
      qty: Number(item.qty),
    }))
    .filter((item) => item.productId && item.qty > 0);

  if (!orderNumber) return setError("El folio es obligatorio");
  if (!items.length) return setError("Agrega al menos un producto");

  try {
    setError(null);
    const created = await apiFetch("/orders", {
      method: "POST",
      body: JSON.stringify({ orderNumber, items }),
    });
    state.orders.push(created);
    state.orderItems = [{ productId: "", qty: 1 }];
    event.currentTarget.reset();
    renderOrderItems();
    renderOrders();
  } catch (error) {
    setError(error.message);
  }
});

loadInitialData();
