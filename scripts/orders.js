// Orders page script
console.log("orders.js loaded");

let allOrders = [];
let currentFilter = 'all';

// Load orders on page load
document.addEventListener('DOMContentLoaded', async function () {
    await loadOrders();
});

async function loadOrders() {
    try {
        const token = localStorage.getItem('accessToken');

        if (!token) {
            showEmptyState();
            return;
        }

        const response = await fetch('http://localhost:5000/api/orders/buyer', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = 'signin.html';
            }
            throw new Error('Failed to load orders');
        }

        const data = await response.json();
        allOrders = data.data || [];
        displayOrders();
    } catch (error) {
        console.error('Error loading orders:', error);
        const container = document.getElementById('ordersContainer');
        container.innerHTML = '<div class="alert alert-danger rounded-3 border-0"><i class="fas fa-exclamation-circle me-2"></i>Error loading orders. Please try again later.</div>';
    }
}

function displayOrders() {
    const filtered = currentFilter === 'all' ? allOrders : allOrders.filter(o => o.status === currentFilter);

    const container = document.getElementById('ordersContainer');
    const emptyState = document.getElementById('emptyState');

    if (filtered.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    container.innerHTML = filtered.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div class="order-header-left">
                    <div class="order-id">Order #${order._id.slice(-8)}</div>
                    <div class="order-date">${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                </div>
                <span class="order-status status-${order.status.toLowerCase()}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
            </div>
            <div class="order-body">
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <img src="https://via.placeholder.com/80x100?text=${item.title}" alt="${item.title}" class="item-image">
                            <div class="item-details">
                                <p class="item-title">${item.title || 'Book'}</p>
                                <p class="item-author">${item.bookId || 'Unknown Author'}</p>
                                <p class="item-qty">Quantity: ${item.quantity}</p>
                            </div>
                            <div class="item-price">₱${(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                    `).join('')}
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
                    ${order.trackingNumber ? `
                        <button class="btn-track" onclick="trackOrder('${order.trackingNumber}', '${order._id}')">
                            <i class="fas fa-map-marker-alt me-2"></i>Track Shipment
                        </button>
                    ` : ''}
                    <button class="btn-secondary" onclick="viewOrderDetails('${order._id}')">
                        <i class="fas fa-eye me-2"></i>View Details
                    </button>
                    ${order.status !== 'delivered' ? `
                        <button class="btn-secondary" onclick="contactSeller('${order._id}')">
                            <i class="fas fa-envelope me-2"></i>Contact Seller
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function filterOrders(status) {
    currentFilter = status;
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.style.background = 'transparent';
        tab.style.color = '#111827';
        tab.style.borderColor = '#d1d5db';
    });

    const activeTab = event.target;
    activeTab.classList.add('active');
    activeTab.style.background = '#111827';
    activeTab.style.color = '#ffffff';
    activeTab.style.borderColor = '#111827';

    displayOrders();
}

function trackOrder(trackingNumber, orderId) {
    // Create modal or navigate to tracking page
    const message = `Tracking Number: ${trackingNumber}\n\nOrder ID: ${orderId}\n\nYour package is on the way! Tracking details will be updated soon.`;
    alert(message);
    // TODO: Implement proper tracking page
}

function viewOrderDetails(orderId) {
    const order = allOrders.find(o => o._id === orderId);
    if (order) {
        console.log('View order details:', order);
        // TODO: Navigate to order details page or show modal
        alert(`Order Details:\nOrder ID: ${orderId}\nStatus: ${order.status}\nTotal: ₱${order.totalAmount.toFixed(2)}`);
    }
}

function contactSeller(orderId) {
    const order = allOrders.find(o => o._id === orderId);
    if (order) {
        console.log('Contact seller for order:', orderId);
        // TODO: Implement contact seller functionality
        alert('Contact seller feature coming soon!');
    }
}

function showEmptyState() {
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('ordersContainer').innerHTML = '';
}
