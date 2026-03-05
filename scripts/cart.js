let cartSearchQuery = "";
let fullCartData = [];

document.addEventListener("DOMContentLoaded", async function () {
  await initCartPage();
});

async function initCartPage() {
  console.log("=== Cart page initializing ===");
  initCartCalculations();
  await loadCart();
  setupCartSearchListener();
  initCheckoutProcess();
  initContinueShopping();
  console.log("=== Cart page initialized ===");
}

function initCartCalculations() {
  updateCartTotal();
}

function initQuantityControls() {
  const quantityBtns = document.querySelectorAll(".quantity button");

  quantityBtns.forEach((btn) => {
    btn.addEventListener("click", async function () {
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

      // Update cart in database
      const item = fullCartData[itemIndex];
      if (!window.CartService || !CartService.isAuthenticated()) {
        showNotification("Please sign in to manage your cart");
        await loadCart();
        return;
      }

      await CartService.updateCartItemDB(
        item.bookId || item._id,
        quantity,
        item.title || "",
      );

      // Update fullCartData
      if (fullCartData[itemIndex]) {
        fullCartData[itemIndex].quantity = quantity;
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
      priceElement.textContent.replace("₱", "").replace(",", ""),
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
    btn.addEventListener("click", async function () {
      const cartItem = this.closest(".cart-item");
      const itemTitle =
        cartItem?.querySelector(".item-title")?.textContent || "Item";
      const itemIndex = parseInt(cartItem.dataset.index);
      const removedItem = fullCartData[itemIndex];

      // Remove from cart in database
      if (!window.CartService || !CartService.isAuthenticated()) {
        showNotification("Please sign in to manage your cart");
        return;
      }

      await CartService.removeFromCartDB(
        removedItem.bookId || removedItem._id,
        removedItem.title || "",
      );

      // Animate removal
      cartItem.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      cartItem.style.opacity = "0";
      cartItem.style.transform = "translateX(-100%)";

      setTimeout(async () => {
        // Reload cart to update indices
        await loadCart();
        // Show notification with undo option
        showRemovalNotification(itemTitle, removedItem, itemIndex);
      }, 300);
    });
  });
}

function initClearCartButton() {
  const cartListHeader = document.querySelector(".cart-list-header");

  if (cartListHeader) {
    // Ensure only one clear button exists
    const existingClearBtn = cartListHeader.querySelector(".btn-clear-all");
    if (existingClearBtn) {
      existingClearBtn.remove();
    }

    // Don't render clear button when cart is empty
    if (!Array.isArray(fullCartData) || fullCartData.length === 0) {
      return;
    }

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
    clearAllBtn.addEventListener("click", async function () {
      const currentCart = [...fullCartData];

      // Clear cart in database
      if (!window.CartService || !CartService.isAuthenticated()) {
        showNotification("Please sign in to manage your cart");
        return;
      }

      await CartService.clearCartDB();

      await loadCart(); // Reload the cart UI
      showClearCartNotification(currentCart);
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

async function loadCart() {
  try {
    console.log("=== loadCart() started ===");
    if (!window.CartService) {
      console.warn("CartService not available, rendering empty cart");
      fullCartData = [];
    } else {
      console.log("CartService available, calling getCart()");
      fullCartData = await CartService.getCart();
      console.log(
        "CartService.getCart() returned",
        fullCartData?.length || 0,
        "items",
      );
      console.log("fullCartData:", fullCartData);
    }

    console.log("Displaying", fullCartData.length, "cart items");
    if (fullCartData && fullCartData.length > 0) {
      console.log(
        "[cart.js] First item in fullCartData:",
        JSON.stringify(fullCartData[0]),
      );
    }
    displayCartItems(fullCartData);
    initQuantityControls();
    initRemoveButtons();
    initClearCartButton();
  } catch (error) {
    console.error("Error loading cart:", error);
    console.error("[cart.js] Stack trace:", error.stack);
    fullCartData = [];
    displayCartItems(fullCartData);
    initQuantityControls();
    initRemoveButtons();
    initClearCartButton();
  }
}

function displayCartItems(itemsToDisplay = fullCartData) {
  const cartItemsContainer = document.getElementById("cartItems");

  if (!cartItemsContainer) {
    console.error("Cart container not found");
    return;
  }

  console.log(
    "[cart.js] displayCartItems() - items to display:",
    itemsToDisplay?.length || 0,
  );
  if (itemsToDisplay && itemsToDisplay.length > 0) {
    console.log(
      "[cart.js] First item to display:",
      JSON.stringify(itemsToDisplay[0]),
    );
  }

  if (itemsToDisplay.length === 0) {
    console.log("No items to display, showing empty cart message");
    cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>${cartSearchQuery.trim() ? "No items found" : "Your cart is empty"}</h3>
                <p>${cartSearchQuery.trim() ? "Try another search" : "Add some books to get started!"}</p>
                ${!cartSearchQuery.trim() ? '<a href="shop.html" class="btn btn-primary">Start Shopping</a>' : ""}
            </div>
        `;
    updateCartTotal();
    return;
  }

  // Clear the empty cart message
  cartItemsContainer.innerHTML = "";

  // Add each cart item
  itemsToDisplay.forEach((item, index) => {
    console.log(`[cart.js] Rendering cart item ${index}:`, item.title);
    console.log(
      `[cart.js] Item ${index} - price: ${item.price}, image: ${item.image}, quantity: ${item.quantity}`,
    );
    // Get the original index from fullCartData
    const originalIndex = fullCartData.findIndex(
      (i) => i.title === item.title && i.author === item.author,
    );

    // Adjust image path for cart page (pages/cart.html)
    let imagePath = item.image || "../images/placeholder.jpg";
    if (imagePath && imagePath.startsWith("images/")) {
      imagePath = "../" + imagePath;
    }

    const cartItemHTML = `
            <div class="cart-item" data-index="${originalIndex}" data-book-id="${item.bookId || item._id}">
                <div class="item-image">
                    <img src="${imagePath}" alt="${item.title}" loading="lazy" onerror="this.onerror=null; this.src='../images/placeholder.jpg'; console.error('Failed to load image:', '${imagePath}');"/>
                </div>
                
                <div class="item-details">
                    <div class="item-title">${item.title}</div>
                    <div class="item-author">${item.author || "Unknown Author"}</div>
                    <div class="item-meta">
                        <span class="item-badge">${item.condition || "Good"}</span>
                        <span class="item-seller">${item.seller || "Sold by Re;Read"}</span>
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

  console.log("Finished rendering", itemsToDisplay.length, "cart items");

  // DO NOT reinitialize controls here - they're initialized in loadCart()
  // This prevents duplicate event listeners
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
        priceElement.textContent.replace("₱", "").replace(",", ""),
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

// Show removal notification with undo option
function showRemovalNotification(itemTitle, removedItem, itemIndex) {
  const notification = document.createElement("div");
  notification.className = "cart-notification cart-notification-removal";
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #f59e0b;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    z-index: 1000;
    animation: slideIn 0.3s ease;
    display: flex;
    align-items: center;
    gap: 12px;
  `;

  notification.innerHTML = `
    <span>"${itemTitle}" removed from cart</span>
    <button id="undoRemoval" style="background: rgba(255,255,255,0.3); border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-weight: 600;">Undo</button>
  `;

  document.body.appendChild(notification);

  const undoBtn = notification.querySelector("#undoRemoval");
  let dismissed = false;

  if (undoBtn) {
    undoBtn.addEventListener("click", async () => {
      if (dismissed) return;
      dismissed = true;

      // Restore item to cart in database
      if (!window.CartService || !CartService.isAuthenticated()) {
        showNotification("Please sign in to manage your cart");
        return;
      }

      await CartService.addToCartDB(
        removedItem.bookId || removedItem._id,
        removedItem.quantity || 1,
      );

      await loadCart();

      // Remove notification
      notification.style.animation = "slideOut 0.3s ease";
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);

      showNotification(`"${itemTitle}" restored to cart`);
    });
  }

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (!dismissed) {
      dismissed = true;
      notification.style.animation = "slideOut 0.3s ease";
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }
  }, 5000);
}

// Show clear cart notification with undo option
function showClearCartNotification(clearedCart) {
  const notification = document.createElement("div");
  notification.className = "cart-notification cart-notification-clear";
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ef4444;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    z-index: 1000;
    animation: slideIn 0.3s ease;
    display: flex;
    align-items: center;
    gap: 12px;
  `;

  notification.innerHTML = `
    <span>Cart cleared (${clearedCart.length} item${clearedCart.length !== 1 ? "s" : ""})</span>
    <button id="undoClear" style="background: rgba(255,255,255,0.3); border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-weight: 600;">Undo</button>
  `;

  document.body.appendChild(notification);

  const undoBtn = notification.querySelector("#undoClear");
  let dismissed = false;

  if (undoBtn) {
    undoBtn.addEventListener("click", async () => {
      if (dismissed) return;
      dismissed = true;

      // Restore cart in database
      if (!window.CartService || !CartService.isAuthenticated()) {
        showNotification("Please sign in to manage your cart");
        return;
      }

      for (const item of clearedCart) {
        await CartService.addToCartDB(
          item.bookId || item._id,
          item.quantity || 1,
        );
      }

      await loadCart();

      // Remove notification
      notification.style.animation = "slideOut 0.3s ease";
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);

      showNotification("Cart restored");
    });
  }

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (!dismissed) {
      dismissed = true;
      notification.style.animation = "slideOut 0.3s ease";
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }
  }, 5000);
}

function setupCartSearchListener() {
  const searchInput = document.getElementById("cartSearchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    cartSearchQuery = e.target.value;
    filterCartItems();
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchInput.value = "";
      cartSearchQuery = "";
      filterCartItems();
    }
  });
}

function filterCartItems() {
  if (!cartSearchQuery.trim()) {
    displayCartItems(fullCartData);
    return;
  }

  const query = cartSearchQuery.toLowerCase().trim();
  const filtered = fullCartData.filter((item) => {
    const titleMatch = item.title.toLowerCase().includes(query);
    const authorMatch = (item.author || "").toLowerCase().includes(query);
    return titleMatch || authorMatch;
  });

  displayCartItems(filtered);
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
