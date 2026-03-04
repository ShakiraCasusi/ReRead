// Orders page script
console.log("orders.js loaded");

const API_BASE_URL = "http://localhost:5000/api";
const ORDER_IMAGE_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSIxMDAiPjxyZWN0IGZpbGw9IiNmM2Y0ZjYiIHdpZHRoPSI4MCIgaGVpZ2h0PSIxMDAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Qm9vazwvdGV4dD48L3N2Zz4=";

let allOrders = [];
let currentFilter = "all";
let searchQuery = "";

// Load orders on page load
document.addEventListener("DOMContentLoaded", async function () {
  await loadOrders();
  setupSearchListener();
});

function getAccessToken() {
  return (
    sessionStorage.getItem("accessToken") ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

function parsePrice(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace(/[₱,]/g, "").trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeOrder(rawOrder) {
  const sourceItems = Array.isArray(rawOrder.items) ? rawOrder.items : [];

  const items = sourceItems.map((item) => {
    const unitPrice = parsePrice(item.price);
    const quantity = Number(item.quantity) || 1;

    return {
      title: item.title || "Book",
      author: item.author || item.bookId || "Unknown Author",
      image: item.image || ORDER_IMAGE_PLACEHOLDER,
      quantity,
      price: unitPrice,
    };
  });

  const computedTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return {
    _id:
      rawOrder._id ||
      rawOrder.orderNumber ||
      `LOCAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt:
      rawOrder.createdAt || rawOrder.orderDate || new Date().toISOString(),
    status: String(rawOrder.status || "pending").toLowerCase(),
    paymentStatus: String(rawOrder.paymentStatus || "pending").toLowerCase(),
    totalAmount:
      parsePrice(rawOrder.totalAmount) ||
      parsePrice(rawOrder.total) ||
      computedTotal,
    trackingNumber: rawOrder.trackingNumber || "",
    items,
  };
}

function getLocalOrders() {
  const localOrders =
    JSON.parse(localStorage.getItem("rereadOrders") || "[]") || [];
  const lastOrder = JSON.parse(
    localStorage.getItem("rereadLastOrder") || "null",
  );

  // Keep last order visible even if not yet in rereadOrders
  if (
    lastOrder &&
    !localOrders.some((order) => order.orderNumber === lastOrder.orderNumber)
  ) {
    localOrders.unshift(lastOrder);
  }

  return localOrders.map(normalizeOrder);
}

async function loadOrders() {
  const token = getAccessToken();

  // Try API first when authenticated
  if (token) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/buyer`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const apiOrders = (data.data || []).map(normalizeOrder);

        // Use API orders for authenticated users (even if empty)
        allOrders = apiOrders;
        displayOrders();
        return;
      }

      if (response.status === 401) {
        sessionStorage.removeItem("accessToken");
        localStorage.removeItem("accessToken");
        console.log("Session expired, please log in again");
      }
    } catch (error) {
      console.warn("Orders API unavailable:", error.message);
    }
  }

  // For guest users or API failure, use localStorage fallback
  allOrders = getLocalOrders();
  displayOrders();
}

function displayOrders() {
  let filtered = allOrders;

  // Apply status filter
  if (currentFilter !== "all") {
    filtered = filtered.filter((o) => o.status === currentFilter);
  }

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter((order) => {
      // Search in book titles and authors
      const matchesBook = order.items.some(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.author.toLowerCase().includes(query),
      );
      // Also search in order ID
      const matchesOrderId = String(order._id).toLowerCase().includes(query);
      return matchesBook || matchesOrderId;
    });
  }

  const container = document.getElementById("ordersContainer");
  const emptyState = document.getElementById("emptyState");

  if (!container || !emptyState) return;

  if (filtered.length === 0) {
    container.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  container.innerHTML = filtered
    .map(
      (order) => `
        <div class="order-card">
            <div class="order-header">
                <div class="order-header-left">
                    <div class="order-id">Order #${String(order._id).slice(-8)}</div>
                    <div class="order-date">${new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</div>
                </div>
                <span class="order-status status-${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
            </div>
            <div class="order-body">
                <div class="order-items">
                    ${order.items
                      .map(
                        (item) => `
                        <div class="order-item">
                            <img src="${item.image || ORDER_IMAGE_PLACEHOLDER}" alt="${item.title}" class="item-image" onerror="this.src='${ORDER_IMAGE_PLACEHOLDER}'">
                            <div class="item-details">
                                <p class="item-title">${item.title || "Book"}</p>
                                <p class="item-author">${item.author || "Unknown Author"}</p>
                                <p class="item-qty">Quantity: ${item.quantity}</p>
                            </div>
                            <div class="item-price">₱${(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>

                <div class="order-summary">
                    <div class="summary-item">
                        <div class="summary-label">Total Amount</div>
                        <div class="summary-value">₱${order.totalAmount.toFixed(2)}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Payment Status</div>
                        <div class="summary-value" style="font-size: 14px; text-transform: capitalize;">${order.paymentStatus}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Order Status</div>
                        <div class="summary-value" style="font-size: 14px; text-transform: capitalize;">${order.status}</div>
                    </div>
                </div>

                <div class="order-actions">
                    ${
                      order.trackingNumber
                        ? `
                        <button class="btn-track" onclick="trackOrder('${order.trackingNumber}', '${order._id}')">
                            <i class="fas fa-map-marker-alt me-2"></i>Track Shipment
                        </button>
                    `
                        : ""
                    }
                    <button class="btn-secondary" onclick="viewOrderDetails('${order._id}')">
                        <i class="fas fa-eye me-2"></i>View Details
                    </button>
                    ${
                      order.status !== "delivered"
                        ? `
                        <button class="btn-secondary" onclick="contactSeller('${order._id}')">
                            <i class="fas fa-envelope me-2"></i>Contact Seller
                        </button>
                    `
                        : ""
                    }
                </div>
            </div>
        </div>
    `,
    )
    .join("");
}

function filterOrders(status, evt) {
  currentFilter = status;
  document.querySelectorAll(".filter-tab").forEach((tab) => {
    tab.classList.remove("active");
    tab.style.background = "transparent";
    tab.style.color = "#111827";
    tab.style.borderColor = "#d1d5db";
  });

  const activeTab =
    evt?.target ||
    document.querySelector(`.filter-tab[onclick*="filterOrders('${status}')"]`);

  if (activeTab) {
    activeTab.classList.add("active");
    activeTab.style.background = "#111827";
    activeTab.style.color = "#ffffff";
    activeTab.style.borderColor = "#111827";
  }

  displayOrders();
}

function trackOrder(trackingNumber, orderId) {
  const message = `Tracking Number: ${trackingNumber}\n\nOrder ID: ${orderId}\n\nYour package is on the way! Tracking details will be updated soon.`;
  alert(message);
}

function viewOrderDetails(orderId) {
  const order = allOrders.find((o) => o._id === orderId);
  if (order) {
    alert(
      `Order Details:\nOrder ID: ${orderId}\nStatus: ${order.status}\nTotal: ₱${order.totalAmount.toFixed(2)}`,
    );
  }
}

function contactSeller(orderId) {
  const order = allOrders.find((o) => o._id === orderId);
  if (order) {
    alert("Contact seller feature coming soon!");
  }
}

function setupSearchListener() {
  const searchInput = document.getElementById("ordersSearchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    displayOrders();
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchInput.value = "";
      searchQuery = "";
      displayOrders();
    }
  });
}

function showEmptyState() {
  const emptyState = document.getElementById("emptyState");
  const ordersContainer = document.getElementById("ordersContainer");

  if (emptyState) emptyState.style.display = "block";
  if (ordersContainer) ordersContainer.innerHTML = "";
}
