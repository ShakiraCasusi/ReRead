// scripts/cart.js - JavaScript for the cart page

document.addEventListener("DOMContentLoaded", function () {
  initCartPage();
});

function initCartPage() {
  console.log("=== Cart page initializing ===");
  initCartCalculations();
  initQuantityControls();
  initRemoveButtons();
  initClearCartButton();
  loadCartFromStorage(); // Load cart first
  initCheckoutProcess();
  initContinueShopping();
  console.log("=== Cart page initialized ===");
}

function initCartCalculations() {
  // Calculate totals when page loads and when quantities change
  updateCartTotal();

  // Auto-update when quantities change (already handled by main.js)
  // Can add additional logic here if needed
}

function initQuantityControls() {
  const quantityBtns = document.querySelectorAll(".quantity button");

  quantityBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const cartItem = this.closest(".cart-item");
      const quantitySpan = cartItem.querySelector(".quantity span");
      const itemIndex = parseInt(cartItem.dataset.index);
      let quantity = parseInt(quantitySpan.textContent);

      if (this.classList.contains("qty-increase") && quantity < 99) {
        quantity++;
      } else if (this.classList.contains("qty-decrease") && quantity > 1) {
        quantity--;
      } else {
        return; // No action needed
      }

      quantitySpan.textContent = quantity;

      // Update localStorage
      const cart = JSON.parse(localStorage.getItem("rereadCart")) || [];
      if (cart[itemIndex]) {
        cart[itemIndex].quantity = quantity;
        localStorage.setItem("rereadCart", JSON.stringify(cart));
      }

      // Update overall cart total
      updateCartTotal();
    });
  });
}

function updateItemTotal(cartItem, quantity) {
  if (!cartItem) return;

  const priceElement = cartItem.querySelector(".current");
  const totalElement = cartItem.querySelector(".item-total");

  if (priceElement) {
    const price = parseFloat(
      priceElement.textContent.replace("₱", "").replace(",", "")
    );
    const total = price * quantity;

    if (totalElement) {
      totalElement.textContent = `₱${total}`;
    }
  }
}

function initRemoveButtons() {
  const removeBtns = document.querySelectorAll(".btn-remove");

  removeBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const cartItem = this.closest(".cart-item");
      const itemTitle =
        cartItem?.querySelector(".item-title")?.textContent || "Item";
      const itemIndex = parseInt(cartItem.dataset.index);

      if (confirm(`Remove "${itemTitle}" from your cart?`)) {
        // Remove from localStorage
        const cart = JSON.parse(localStorage.getItem("rereadCart")) || [];
        cart.splice(itemIndex, 1);
        localStorage.setItem("rereadCart", JSON.stringify(cart));

        // Animate removal
        cartItem.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        cartItem.style.opacity = "0";
        cartItem.style.transform = "translateX(-100%)";

        setTimeout(() => {
          // Reload cart to update indices
          loadCartFromStorage();
        }, 300);
      }
    });
  });
}

function initClearCartButton() {
  const cartListHeader = document.querySelector(".cart-list-header");

  if (cartListHeader) {
    // Ensure the header is a flex container for proper alignment
    cartListHeader.style.display = "flex";
    cartListHeader.style.justifyContent = "space-between";
    cartListHeader.style.alignItems = "center";

    // Create the button
    const clearAllBtn = document.createElement("button");
    clearAllBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Clear All';
    clearAllBtn.className = "btn-clear-all";
    clearAllBtn.style.cssText = `
      background: #fff1f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      padding: 8px 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
    `;

    // Add hover effect
    clearAllBtn.addEventListener("mouseenter", () => {
      clearAllBtn.style.background = "#fee2e2";
    });
    clearAllBtn.addEventListener("mouseleave", () => {
      clearAllBtn.style.background = "#fff1f2";
    });

    // Add event listener
    clearAllBtn.addEventListener("click", function () {
      if (
        confirm("Are you sure you want to remove all items from your cart?")
      ) {
        localStorage.removeItem("rereadCart");
        loadCartFromStorage(); // Reload the cart UI
        showNotification("Cart has been cleared.", "info");
      }
    });

    cartListHeader.appendChild(clearAllBtn);
  }
}

function checkEmptyCart() {
  const cartItems = document.querySelectorAll(".cart-item");

  if (cartItems.length === 0) {
    showEmptyCartMessage();
  }
}

function showEmptyCartMessage() {
  const cartList = document.getElementById("cartItems");

  if (cartList) {
    cartList.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Your cart is empty</h3>
                <p>Add some books to get started!</p>
                <a href="shop.html" class="btn btn-primary">Start Shopping</a>
            </div>
        `;

    updateCartTotal();
  }
}

function initCheckoutProcess() {
  // Let the checkout button work naturally as a link
  // Validation will be done in checkout.html itself
  console.log("Checkout button initialized - no validation needed here");
}

// Removed old proceedToCheckout function - checkout handled in checkout.html

function initContinueShopping() {
  // No need to prevent default, buttons are already links in HTML
  // Just let them work naturally
}

function loadCartFromStorage() {
  const cart = JSON.parse(localStorage.getItem("rereadCart")) || [];
  const cartItemsContainer = document.getElementById("cartItems");

  if (!cartItemsContainer) return;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Your cart is empty</h3>
                <p>Add some books to get started!</p>
                <a href="shop.html" class="btn btn-primary">Start Shopping</a>
            </div>
        `;
    updateCartTotal();
    return;
  }

  // Clear the empty cart message
  cartItemsContainer.innerHTML = "";

  // Add each cart item
  cart.forEach((item, index) => {
    // Adjust image path for cart page (pages/cart.html)
    let imagePath = item.image || "../images/placeholder.jpg";
    if (imagePath.startsWith("images/")) {
      imagePath = "../" + imagePath;
    }

    const cartItemHTML = `
            <div class="cart-item" data-index="${index}">
                <div class="item-image">
                    <img src="${imagePath}" alt="${item.title}"/>
                </div>
                
                <div class="item-details">
                    <div class="item-title">${item.title}</div>
                    <div class="item-author">${
                      item.author || "Unknown Author"
                    }</div>
                    <div class="item-meta">
                        <span class="item-badge">${
                          item.condition || "Good"
                        }</span>
                        <span class="item-seller">${
                          item.seller || "Sold by Re;Read"
                        }</span>
                    </div>
                    
                    <div class="item-price">
                        <span class="current">${item.price}</span>
                    </div>
                </div>
                
                <div class="item-actions">
                    <div class="quantity">
                        <button class="qty-decrease">-</button>
                        <span>${item.quantity || 1}</span>
                        <button class="qty-increase">+</button>
                    </div>
                    <button class="btn-remove"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    cartItemsContainer.insertAdjacentHTML("beforeend", cartItemHTML);
  });

  // Reinitialize controls for dynamically added items
  initQuantityControls();
  initRemoveButtons();
  updateCartTotal();
}

function updateCartTotal() {
  const cartItems = document.querySelectorAll(".cart-item");
  let subtotal = 0;
  let itemCount = 0;

  cartItems.forEach((item) => {
    const priceElement = item.querySelector(".current");
    const quantityElement = item.querySelector(".quantity span");

    if (priceElement && quantityElement) {
      const price = parseFloat(
        priceElement.textContent.replace("₱", "").replace(",", "")
      );
      const quantity = parseInt(quantityElement.textContent);
      subtotal += price * quantity;
      itemCount += quantity;
    }
  });

  // Update order summary with the correct IDs
  const itemCountElement = document.getElementById("itemCount");
  const subtotalElement = document.getElementById("subtotalAmount");
  const shippingElement = document.getElementById("shippingAmount");
  const totalElement = document.getElementById("totalAmount");

  if (itemCountElement) {
    itemCountElement.textContent = itemCount;
  }

  if (subtotalElement) {
    subtotalElement.textContent = `₱${subtotal.toFixed(0)}`;
  }

  const shipping = 0; // Shipping will be calculated at checkout based on region

  if (shippingElement) {
    if (subtotal > 0) {
      shippingElement.textContent = "Calculated at checkout";
      shippingElement.className = "text-muted small";
    } else {
      shippingElement.textContent = "₱0";
    }
  }

  if (totalElement) {
    const total = subtotal + shipping;
    totalElement.textContent = `₱${total.toFixed(0)}`;
  }

  // Update cart badge
  updateCartBadge(itemCount);
}

function updateCartBadge(count) {
  const badges = document.querySelectorAll("#cartBadge, #cartBadgeMobile");

  badges.forEach((badge) => {
    badge.textContent = count;
    badge.setAttribute("data-count", count);
    // The visibility is now handled purely by CSS using the [data-count="0"] selector
  });
}

// Utility function to show notifications
function showNotification(message) {
  // Create a simple notification
  const notification = document.createElement("div");
  notification.className = "cart-notification";
  notification.textContent = message;
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Add CSS animations for notifications
if (!document.querySelector("#cart-notifications-styles")) {
  const style = document.createElement("style");
  style.id = "cart-notifications-styles";
  style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
  document.head.appendChild(style);
}
