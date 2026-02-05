// scripts/main.js - Re;Read Website Functionality

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initMobileMenu();
  initTypingAnimation();
  initScrollAnimations();
  initSearchFunctionality();
  initDropdownNavigation();
  initCartFunctionality();
  highlightActiveNavLinks();

  // Only init filter functionality if NOT on shop page
  // Shop page has its own filter system in shop.js
  if (!document.getElementById("booksGrid")) {
    initFilterFunctionality();
  }

  loadCartFromLocalStorage();

  // Load homepage API-integrated books if on homepage
  if (document.querySelector(".hero-images") || document.querySelector(".new-releases") || document.querySelector(".featured-section")) {
    initHomepageBooks();
  }

  console.log("Re;Read website initialized successfully");
});

// ============================================
// MOBILE MENU FUNCTIONALITY
// ============================================
function initMobileMenu() {
  const navbar = document.querySelector(".navbar");
  const headerContainer = document.querySelector(".header-container");

  if (!navbar || !headerContainer) return;

  // Create mobile menu toggle button
  function createMobileToggle() {
    // Remove existing toggle if any
    const existingToggle = document.querySelector(".mobile-menu-toggle");
    if (existingToggle) {
      existingToggle.remove();
    }

    if (window.innerWidth <= 768) {
      const mobileToggle = document.createElement("button");
      mobileToggle.className = "mobile-menu-toggle";
      mobileToggle.setAttribute("aria-label", "Toggle mobile menu");
      mobileToggle.setAttribute("type", "button");
      mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';

      // Insert after the mobile cart link when available
      const mobileCartLink = document.querySelector(".cart-link-mobile");
      const cartLink = document.querySelector(".cart-link");
      if (mobileCartLink && mobileCartLink.parentNode) {
        mobileCartLink.parentNode.insertBefore(
          mobileToggle,
          mobileCartLink.nextSibling,
        );
      } else if (cartLink && cartLink.parentNode) {
        cartLink.parentNode.insertBefore(mobileToggle, cartLink.nextSibling);
      } else {
        headerContainer.appendChild(mobileToggle);
      }

      // Add click event
      mobileToggle.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleMobileMenu();
      });
    }
  }

  // Toggle mobile menu
  function toggleMobileMenu() {
    const navbar = document.querySelector(".navbar");
    const mobileToggle = document.querySelector(".mobile-menu-toggle");

    if (!navbar || !mobileToggle) return;

    const isActive = navbar.classList.contains("mobile-active");

    if (isActive) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  // Open mobile menu
  function openMobileMenu() {
    const navbar = document.querySelector(".navbar");
    const mobileToggle = document.querySelector(".mobile-menu-toggle");

    navbar.classList.add("mobile-active");
    mobileToggle.classList.add("active");

    const icon = mobileToggle.querySelector("i");
    if (icon) {
      icon.className = "fas fa-times";
    }

    // Prevent body scroll when menu is open
    document.body.style.overflow = "hidden";
  }

  // Close mobile menu
  function closeMobileMenu() {
    const navbar = document.querySelector(".navbar");
    const mobileToggle = document.querySelector(".mobile-menu-toggle");

    if (!navbar || !mobileToggle) return;

    navbar.classList.remove("mobile-active");
    mobileToggle.classList.remove("active");

    const icon = mobileToggle.querySelector("i");
    if (icon) {
      icon.className = "fas fa-bars";
    }

    // Restore body scroll
    document.body.style.overflow = "";
  }

  // Close menu when clicking outside
  document.addEventListener("click", function (event) {
    const navbar = document.querySelector(".navbar");
    const mobileToggle = document.querySelector(".mobile-menu-toggle");

    if (!navbar || !mobileToggle) return;

    if (navbar.classList.contains("mobile-active")) {
      if (
        !navbar.contains(event.target) &&
        !mobileToggle.contains(event.target)
      ) {
        closeMobileMenu();
      }
    }
  });

  // Close menu when clicking on a link (except dropdown)
  navbar.addEventListener("click", function (event) {
    if (event.target.tagName === "A" && !event.target.closest(".dropdown")) {
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          closeMobileMenu();
        }, 150);
      }
    }
  });

  // Handle window resize
  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      const navbar = document.querySelector(".navbar");

      if (window.innerWidth > 768) {
        // Desktop view - remove mobile classes and toggle
        const mobileToggle = document.querySelector(".mobile-menu-toggle");
        if (navbar) {
          navbar.classList.remove("mobile-active");
        }
        if (mobileToggle) {
          mobileToggle.remove();
        }
        document.body.style.overflow = "";
      } else {
        // Mobile view - ensure toggle exists
        createMobileToggle();
      }
    }, 250);
  });

  // Initial setup
  createMobileToggle();
}

// TYPING ANIMATION - Per letter, sequential for multiple elements
function initTypingAnimation() {
  const typingElements = document.querySelectorAll(".typing-text");
  if (typingElements.length === 0) return;

  // Disable typing animation on mobile for better UX
  if (window.innerWidth <= 768) {
    typingElements.forEach((el) => {
      el.style.borderRight = "none";
      el.style.whiteSpace = "normal";
      el.style.animation = "none";
    });
    return;
  }

  // Sort elements by data-typing-order attribute
  const sortedElements = Array.from(typingElements).sort((a, b) => {
    const orderA = parseInt(a.getAttribute("data-typing-order") || "0");
    const orderB = parseInt(b.getAttribute("data-typing-order") || "0");
    return orderA - orderB;
  });

  // Store original text and clear elements
  const textsToType = sortedElements.map((el) => {
    const caret = el.querySelector(".typing-caret");
    if (caret) {
      caret.style.display = "inline-block";
    }

    const contentSpan = el.querySelector(".typing-content");
    const rawText = contentSpan ? contentSpan.textContent : el.textContent;
    const text = rawText.replace(/^\s+|\s+$/g, "").replace(/\r?\n\s+/g, "\n");

    if (contentSpan) {
      contentSpan.innerHTML = "";
    } else {
      el.innerHTML = "";
    }

    el.style.display = "block";
    el.style.width = "100%";
    return { target: contentSpan || el, text };
  });

  let currentElementIndex = 0;
  let charIndex = 0;

  function typeNextCharacter() {
    if (currentElementIndex >= sortedElements.length) {
      // All elements typed, remove cursor from last element
      setTimeout(() => {
        sortedElements[sortedElements.length - 1].style.borderRight = "none";
      }, 500);
      return;
    }

    const currentElement = sortedElements[currentElementIndex];
    const { target, text: currentText } = textsToType[currentElementIndex];

    if (charIndex < currentText.length) {
      const char = currentText.charAt(charIndex);
      if (char === "\n") {
        target.innerHTML += "<br>";
      } else {
        target.innerHTML += char;
      }
      charIndex++;
      setTimeout(typeNextCharacter, 50); // 50ms per character
    } else {
      // Current element finished, remove cursor and move to next
      currentElement.style.borderRight = "none";
      currentElementIndex++;
      charIndex = 0;

      if (currentElementIndex < sortedElements.length) {
        // Small pause before starting next element
        setTimeout(typeNextCharacter, 300);
      } else {
        typeNextCharacter(); // Finish
      }
    }
  }

  // Start typing after a short delay
  setTimeout(typeNextCharacter, 1000);
}

// SCROLL ANIMATIONS - All sections
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -100px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-in");
      } else {
        // Remove animation class when element leaves viewport
        entry.target.classList.remove("animate-in");
      }
    });
  }, observerOptions);

  // Observe all animated elements
  const animatedElements = document.querySelectorAll(
    ".animate-down, .animate-up, .fade-in, .slide-in-left, .slide-in-right, " +
    ".new-releases, .featured-section, .stats-section, .filters, " +
    ".section-header, .books-grid, .stats, article, .book-card",
  );

  animatedElements.forEach((el) => {
    el.classList.add("fade-in"); // Add fade-in class if not already present
    observer.observe(el);
  });

  // Special observer for stats with scroll reveal
  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target
            .querySelectorAll(".stats > div")
            .forEach((stat, index) => {
              setTimeout(() => {
                stat.style.opacity = "0";
                stat.style.transform = "translateY(30px)";
                setTimeout(() => {
                  stat.style.transition = "all 0.6s ease";
                  stat.style.opacity = "1";
                  stat.style.transform = "translateY(0)";
                }, 50);
              }, index * 150);
            });
        }
      });
    },
    { threshold: 0.3 },
  );

  document.querySelectorAll(".stats").forEach((stats) => {
    statsObserver.observe(stats);
  });
}

// Search functionality
function initSearchFunctionality() {
  const searchInputs = document.querySelectorAll('input[type="text"]');

  if (searchInputs.length === 0) {
    return;
  }

  const desktopSearch = document.querySelector(".search-bar input");
  const mobileSearch = document.querySelector(".search-bar-mobile input");
  const shopSearch = document.querySelector('[data-role="shop-search"]');

  const currentSearch = new URL(window.location.href).searchParams.get(
    "search",
  );
  if (currentSearch) {
    searchInputs.forEach((input) => {
      input.value = currentSearch;
    });
  }

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch(e.target.value);
    }
  };

  if (desktopSearch) desktopSearch.addEventListener("keypress", handleSearch);
  if (mobileSearch) mobileSearch.addEventListener("keypress", handleSearch);
  if (shopSearch) shopSearch.addEventListener("keypress", handleSearch);

  const desktopContainer = document.querySelector(".search-bar");
  if (desktopContainer) {
    const btn = desktopContainer.querySelector("button");
    if (btn)
      btn.addEventListener("click", () => performSearch(desktopSearch.value));
  }
  const mobileContainer = document.querySelector(".search-bar-mobile");
  if (mobileContainer) {
    // No button in mobile search, relies on Enter key
  }
}

function performSearch(query) {
  const trimmed = (query || "").trim();
  if (!trimmed) {
    if (typeof showNotification === "function") {
      showNotification("Please enter a search term", "warning");
    }
    return;
  }

  const currentUrl = new URL(window.location.href);
  const inPagesDirectory = currentUrl.pathname.includes("/pages/");
  const shopPath = currentUrl.pathname.endsWith("/pages/shop.html")
    ? currentUrl.pathname
    : inPagesDirectory
      ? "shop.html"
      : "pages/shop.html";

  const shopUrl = new URL(shopPath, window.location.href);

  if (currentUrl.pathname.endsWith("/pages/shop.html")) {
    shopUrl.search = currentUrl.search;
  }

  shopUrl.searchParams.set("search", trimmed);
  window.location.href = shopUrl.toString();
}

function highlightActiveNavLinks() {
  const currentUrl = new URL(window.location.href);
  const currentPath = normalizePath(currentUrl.pathname);

  const navLinks = document.querySelectorAll(
    'a[href]:not([href^="#"]):not([href^="mailto:"]):not([href^="tel:"])',
  );

  navLinks.forEach((link) => {
    link.classList.remove("nav-link-active");

    const href = link.getAttribute("href");
    if (!href || href.startsWith("http")) {
      return;
    }

    const targetUrl = new URL(href, window.location.href);
    const targetPath = normalizePath(targetUrl.pathname);

    if (currentPath === targetPath) {
      link.classList.add("nav-link-active");
    }
  });
}

function normalizePath(pathname) {
  let normalized = pathname.replace(/\\/g, "/").toLowerCase();

  if (normalized.endsWith("/")) {
    normalized += "index.html";
  } else if (!normalized.endsWith(".html")) {
    normalized += "/index.html";
  }

  return normalized;
}

// Dropdown navigation functionality
function initDropdownNavigation() {
  const dropdownBtns = document.querySelectorAll(".dropdown-btn");

  dropdownBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const dropdown = this.closest(".dropdown");
      const isActive = dropdown?.classList.contains("active");

      document.querySelectorAll(".dropdown").forEach((d) => {
        d.classList.remove("active");
      });

      if (dropdown && !isActive) {
        dropdown.classList.add("active");
      }
    });
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".dropdown")) {
      document.querySelectorAll(".dropdown").forEach((dropdown) => {
        dropdown.classList.remove("active");
      });
    }
  });

  const genreLinks = document.querySelectorAll(".dropdown-content a");
  genreLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      const href = this.getAttribute("href") || "";
      const isShopLink = href.includes("shop.html");

      if (isShopLink) {
        this.closest(".dropdown")?.classList.remove("active");
        return;
      }

      e.preventDefault();
      const genre = this.textContent.trim();
      this.closest(".dropdown")?.classList.remove("active");
      if (typeof showNotification === "function") {
        showNotification(`Filtering by: ${genre}`, "success");
      }
    });
  });
}

// Cart functionality
function initCartFunctionality() {
  const addToCartBtns = document.querySelectorAll(
    ".add-to-cart, .btn-add-to-cart",
  );

  addToCartBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();

      const bookCard = this.closest(".book-card, article");
      if (bookCard) {
        const title =
          bookCard.querySelector("h3")?.textContent || "Unknown Book";
        const author =
          bookCard.querySelector(".author")?.textContent || "Unknown Author";
        const priceElement = bookCard.querySelector(".price");
        const image = bookCard.querySelector("img")?.src || "";

        // Get only the current price (first part before any span)
        let price = "₱0";
        if (priceElement) {
          const priceText =
            priceElement.childNodes[0]?.textContent?.trim() ||
            priceElement.textContent.split(" ")[0];
          price = priceText;
        }

        addToCart({
          title: title,
          author: author,
          price: price,
          image: image,
          quantity: 1,
        });

        // Add animation to button
        this.style.transform = "scale(0.95)";
        setTimeout(() => {
          this.style.transform = "scale(1)";
        }, 150);

        showNotification(`${title} added to cart!`, "success");
      }
    });
  });

  const quantityBtns = document.querySelectorAll(".quantity button");
  quantityBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const action = this.textContent.trim();
      const quantitySpan = this.parentNode.querySelector("span");
      let quantity = parseInt(quantitySpan.textContent);

      if (action === "+" && quantity < 99) {
        quantity++;
      } else if (action === "-" && quantity > 1) {
        quantity--;
      }

      quantitySpan.textContent = quantity;
      updateCartTotal();
    });
  });

  const removeBtns = document.querySelectorAll(".btn-remove");
  removeBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const cartItem = this.closest(".cart-item");
      if (cartItem) {
        if (confirm("Remove this item from cart?")) {
          cartItem.remove();
          updateCartTotal();
          showNotification("Item removed from cart", "info");
        }
      }
    });
  });
}

// Cart management
let cart = [];

function addToCart(item) {
  const existingItem = cart.find((cartItem) => cartItem.title === item.title);

  if (existingItem) {
    existingItem.quantity += item.quantity;
    existingItem.author = item.author;
    existingItem.price = item.price;
    existingItem.image = item.image;
  } else {
    cart.push(item);
  }

  updateCartCount();
  updateCartTotal();
  saveCartToLocalStorage();
}

function updateCartCount() {
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const badges = document.querySelectorAll("#cartBadge, #cartBadgeMobile");

  badges.forEach((badge) => {
    if (cartCount > 0) {
      badge.textContent = cartCount;
      badge.hidden = false; // Use the 'hidden' attribute to show the badge
      badge.classList.add("animate-badge");
      setTimeout(() => badge.classList.remove("animate-badge"), 300);
    } else {
      badge.hidden = true; // Use the 'hidden' attribute to hide the badge
    }
  });
}

function updateCartTotal() {
  const cartItems = document.querySelectorAll(".cart-item");
  let subtotal = 0;

  cartItems.forEach((item) => {
    const priceText = item.querySelector(".current")?.textContent || "₱0";
    const price = parseFloat(priceText.replace("₱", "").replace(",", ""));
    const quantity = parseInt(
      item.querySelector(".quantity span")?.textContent || "1",
    );
    subtotal += price * quantity;
  });

  const subtotalElement = document.querySelector(".summary-row span");
  const totalElement = document.querySelector(".summary-total span");

  if (subtotalElement) {
    const itemCount = cartItems.length;
    subtotalElement.textContent = `Subtotal (${itemCount} items)`;
  }

  if (totalElement) {
    const shipping = 50;
    const total = subtotal + shipping;
    totalElement.textContent = `₱${total.toLocaleString()}`;
  }

  const subtotalAmount = document.querySelector(
    ".summary-row:last-of-type span",
  );
  if (
    subtotalAmount &&
    subtotalElement &&
    subtotalElement.textContent.includes("Subtotal")
  ) {
    subtotalAmount.textContent = `₱${subtotal.toLocaleString()}`;
  }
}

function saveCartToLocalStorage() {
  localStorage.setItem("rereadCart", JSON.stringify(cart));
}

function loadCartFromLocalStorage() {
  const savedCart = localStorage.getItem("rereadCart");
  if (savedCart) {
    cart = JSON.parse(savedCart);
    updateCartCount();
  }
}

// Notification system with types
function showNotification(message, type = "success") {
  const colors = {
    success: "#10b981",
    warning: "#f59e0b",
    info: "#3b82f6",
    error: "#ef4444",
  };

  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.success};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-weight: 500;
        font-size: 15px;
        max-width: 400px;
        transform: translateX(450px);
        transition: transform 0.3s ease;
    `;

  document.body.appendChild(notification);

  // Slide in
  setTimeout(() => {
    notification.style.transform = "translateX(0)";
  }, 10);

  // Slide out and remove
  setTimeout(() => {
    notification.style.transform = "translateX(450px)";
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Filter functionality
function initFilterFunctionality() {
  const filterDropdowns = document.querySelectorAll(".filter-dropdown");

  filterDropdowns.forEach((dropdown) => {
    const btn = dropdown.querySelector(".filter-btn");
    const content = dropdown.querySelector(".filter-dropdown-content");

    if (btn && content) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        const isActive = dropdown.classList.contains("active");

        // Close all other dropdowns
        filterDropdowns.forEach((otherDropdown) => {
          if (otherDropdown !== dropdown) {
            otherDropdown.classList.remove("active");
          }
        });

        // Toggle current dropdown
        if (!isActive) {
          dropdown.classList.add("active");
        } else {
          dropdown.classList.remove("active");
        }
      });
    }
  });

  // Close dropdowns when clicking outside
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".filter-dropdown")) {
      filterDropdowns.forEach((dropdown) => {
        dropdown.classList.remove("active");
      });
    }
  });

  // Handle filter selections
  const filterLinks = document.querySelectorAll(".filter-dropdown-content a");
  filterLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const filterType =
        this.closest(".filter-dropdown").querySelector(".filter-btn").dataset
          .filter;
      const filterValue = this.textContent.trim();

      console.log(`Filter ${filterType}: ${filterValue}`);

      // Close dropdown
      this.closest(".filter-dropdown").classList.remove("active");

      // Apply filter
      applyFilter(filterType, filterValue);
    });
  });

  // Sort button functionality
  const sortBtn = document.querySelector(".sort-btn");
  if (sortBtn) {
    sortBtn.addEventListener("click", function () {
      showNotification("Sorting applied", "info");
    });
  }
}

function applyFilter(filterType, filterValue) {
  console.log(`Applying filter: ${filterType} = ${filterValue}`);
  showNotification(`Filter applied: ${filterValue}`, "success");
}

// Add smooth scrolling to all internal links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const href = this.getAttribute("href");
    if (href !== "#" && document.querySelector(href)) {
      e.preventDefault();
      document.querySelector(href).scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Add parallax effect to hero images on scroll (disabled on mobile)
window.addEventListener("scroll", function () {
  if (window.innerWidth > 768) {
    const heroImages = document.querySelector(".hero-images");
    if (heroImages && window.scrollY < 800) {
      const scrolled = window.scrollY;
      heroImages.style.transform = `translateY(${scrolled * 0.1}px)`;
    }
  }
});

// Prevent horizontal scroll on mobile
function preventHorizontalScroll() {
  if (window.innerWidth <= 768) {
    document.body.style.overflowX = "hidden";
  } else {
    document.body.style.overflowX = "auto";
  }
}

preventHorizontalScroll();
window.addEventListener("resize", preventHorizontalScroll);

console.log("Re;Read - All scripts loaded successfully");

// Initialize typing animation
document.addEventListener("DOMContentLoaded", () => {
  const typingEls = Array.from(document.querySelectorAll(".typing-text"));

  // prepare each element: move full text into data-full and clear visible content
  typingEls.forEach((el) => {
    const contentEl = el.querySelector(".typing-content");
    if (!contentEl) return;
    const full = contentEl.textContent.trim();
    contentEl.dataset.full = full;
    contentEl.innerHTML = ""; // start empty
  });

  // function to type a single element, returns a Promise
  function typeElement(el, speed = 45) {
    return new Promise((resolve) => {
      const contentEl = el.querySelector(".typing-content");
      if (!contentEl) {
        resolve();
        return;
      }
      const full = contentEl.dataset.full || "";
      let i = 0;
      const timer = setInterval(() => {
        const char = full.charAt(i);
        if (char === "\n") {
          contentEl.innerHTML += "<br>";
        } else {
          contentEl.innerHTML += char;
        }
        i++;
        if (i >= full.length) {
          clearInterval(timer);
          resolve();
        }
      }, speed);
    });
  }

  // sequentially type elements based on data-typing-order
  const ordered = typingEls
    .map((el) => ({ order: parseInt(el.dataset.typingOrder || "0", 10), el }))
    .sort((a, b) => a.order - b.order)
    .map((x) => x.el);

  const lastIndex = ordered.length - 1;

  // chain the typing promises
  (async function runSequence() {
    for (let index = 0; index < ordered.length; index++) {
      const el = ordered[index];
      el.classList.add("active");
      await typeElement(el, 45); // adjust speed here (ms per char)

      if (index !== lastIndex) {
        el.classList.remove("active");
        // Immediately start the next line with no extra rest time
        await new Promise((r) => setTimeout(r, 0));
      } else {
        // For the final line, keep caret active without delay
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    // final element keeps active state for caret blink
  })();
});

// ============================================
// NOTIFICATION SYSTEM
// ============================================
/**
 * Show a notification to the user
 * @param {string} type - 'success', 'error', 'warning', or 'info'
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {number} duration - How long to show (ms), 0 = no auto-close
 */
function showNotification(type, title, message = "", duration = 5000) {
  // Create container if it doesn't exist
  let container = document.getElementById("notificationContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "notificationContainer";
    container.className = "notification-container";
    document.body.appendChild(container);
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;

  // Set icons based on type
  const icons = {
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    warning: "fa-exclamation-triangle",
    info: "fa-info-circle",
  };

  const icon = icons[type] || "fa-info-circle";

  notification.innerHTML = `
    <div class="notification-icon">
      <i class="fas ${icon}"></i>
    </div>
    <div class="notification-content">
      <div class="notification-title">${title}</div>
      ${message ? `<p class="notification-message">${message}</p>` : ""}
    </div>
    <button class="notification-close" aria-label="Close notification">
      <i class="fas fa-times"></i>
    </button>
  `;

  // Add close button functionality
  const closeBtn = notification.querySelector(".notification-close");
  closeBtn.addEventListener("click", () => {
    removeNotification(notification);
  });

  // Add to container
  container.appendChild(notification);

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      removeNotification(notification);
    }, duration);
  }

  return notification;
}

/**
 * Remove a notification with animation
 * @param {Element} notification - The notification element to remove
 */
function removeNotification(notification) {
  notification.classList.add("removing");
  setTimeout(() => {
    notification.remove();
  }, 300);
}

// Convenience functions
function showSuccess(title, message = "", duration = 5000) {
  return showNotification("success", title, message, duration);
}

function showError(title, message = "", duration = 5000) {
  return showNotification("error", title, message, duration);
}

function showWarning(title, message = "", duration = 5000) {
  return showNotification("warning", title, message, duration);
}

function showInfo(title, message = "", duration = 5000) {
  return showNotification("info", title, message, duration);
}

// ============================================
// HOMEPAGE API-INTEGRATED BOOKS
// ============================================

/**
 * Initialize books on homepage by fetching from Open Library API
 */
async function initHomepageBooks() {
  try {
    console.log("🔄 Starting homepage book initialization...");

    // Show loading states
    showLoadingState(".hero-images", true);
    showLoadingState(".new-releases .books-grid", true);
    showLoadingState(".featured-section .books-grid", true);

    // Fetch books for each section
    console.log("📚 Fetching books from Open Library API...");
    const heroBooks = await fetchRandomGenreBooks(4); // 4 books with random genres
    const newReleaseBooks = await fetchBooksFromOpenLibrary("recent", 4);
    const featuredBooks = await fetchPopularBooks(4); // Popular/bestselling books

    // Validate that we got books from the API
    if (
      heroBooks.length === 0 &&
      newReleaseBooks.length === 0 &&
      featuredBooks.length === 0
    ) {
      throw new Error(
        "No books fetched from Open Library API"
      );
    }

    console.log(
      `✅ Successfully fetched ${heroBooks.length + newReleaseBooks.length + featuredBooks.length} books from API`
    );

    // Combine all books for sessionStorage
    const allHomepageBooks = [
      ...heroBooks,
      ...newReleaseBooks,
      ...featuredBooks,
    ];
    sessionStorage.setItem("booksDatabase", JSON.stringify(allHomepageBooks));
    console.log("✅ Stored all homepage books in sessionStorage");

    // Render each section
    if (heroBooks.length > 0) {
      renderHeroBooks(heroBooks);
      showLoadingState(".hero-images", false);
    }
    if (newReleaseBooks.length > 0) {
      renderNewReleases(newReleaseBooks);
      showLoadingState(".new-releases .books-grid", false);
    }
    if (featuredBooks.length > 0) {
      renderFeaturedBooks(featuredBooks);
      showLoadingState(".featured-section .books-grid", false);
    }

    console.log("✅ Homepage books initialization complete!");
  } catch (error) {
    console.error("❌ Error initializing homepage books:", error);
    showErrorState(".hero-images");
    showErrorState(".new-releases .books-grid");
    showErrorState(".featured-section .books-grid");
  }
}

/**
 * Show loading state for a container
 */
function showLoadingState(selector, show = true) {
  const element = document.querySelector(selector);
  if (!element) return;

  if (show) {
    element.innerHTML = `
      <div class="loading-state" style="grid-column: 1/-1; text-align: center; padding: 40px 20px;">
        <i class="fas fa-spinner fa-spin" style="font-size: 36px; color: #6b7280; margin-bottom: 12px;"></i>
        <p style="color: #6b7280;">Loading books from Open Library...</p>
      </div>
    `;
  }
}

/**
 * Show error state for a container
 */
function showErrorState(selector) {
  const element = document.querySelector(selector);
  if (!element) return;

  element.innerHTML = `
    <div class="error-state" style="grid-column: 1/-1; text-align: center; padding: 40px 20px;">
      <i class="fas fa-exclamation-circle" style="font-size: 36px; color: #ef4444; margin-bottom: 12px;"></i>
      <p style="color: #ef4444;">Failed to load books from Open Library</p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">Please try refreshing the page</p>
    </div>
  `;
}

/**
 * Fetch books from random genres with popular, well-covered books
 * Mixes popular authors and titles to ensure good cover images
 * @param {number} totalBooks - Total number of books to fetch
 * @returns {Promise<Array>} Array of parsed book objects
 */
async function fetchRandomGenreBooks(totalBooks = 4) {
  try {
    const allBooks = [];
    const uniqueIds = new Set();

    // Top-tier famous authors guaranteed to have book covers on Open Library
    const genreAuthors = {
      romance: ["Jane Austen", "Nora Roberts", "Nicholas Sparks", "Danielle Steel"],
      mystery: ["Agatha Christie", "Arthur Conan Doyle", "Sherlock Holmes", "Ellery Queen"],
      "science fiction": ["Isaac Asimov", "Philip K. Dick", "Ray Bradbury", "Arthur C. Clarke"],
      fantasy: ["J.R.R. Tolkien", "J.K. Rowling", "George R.R. Martin", "Brandon Sanderson"],
      horror: ["Stephen King", "H.P. Lovecraft", "Edgar Allan Poe", "Bram Stoker"],
      adventure: ["Jules Verne", "Robert Louis Stevenson", "Mark Twain", "Jack London"],
      thriller: ["Agatha Christie", "James Patterson", "Dan Brown", "Gillian Flynn"],
      biography: ["Malcolm Gladwell", "Bill Gates", "Steve Jobs", "Walter Isaacson"],
      history: ["Yuval Noah Harari", "David McCullough", "Howard Zinn", "Barbara Tuchman"],
      "self-help": ["Dale Carnegie", "Tony Robbins", "Stephen Covey", "Brene Brown"],
      business: ["Peter Drucker", "Jim Collins", "Michael Porter", "Clayton Christensen"],
      education: ["Paulo Freire", "Malcolm Knowles", "Carol Dweck", "John Dewey"],
    };

    const genres = Object.keys(genreAuthors);

    // Fetch books from diverse genre-author combinations
    for (let i = 0; i < totalBooks && genres.length > 0; i++) {
      const genre = genres[Math.floor(Math.random() * genres.length)];
      const authors = genreAuthors[genre];
      const author = authors[Math.floor(Math.random() * authors.length)];

      try {
        const url = `https://openlibrary.org/search.json?author=${encodeURIComponent(author)}&limit=10&has_fulltext=true`;
        const response = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (response.ok) {
          const result = await response.json();
          const books = result.docs || [];

          // Filter for books with covers and high ratings
          const booksWithCovers = books.filter((book) => {
            return book.cover_i && book.first_publish_year && !uniqueIds.has(book.key);
          });

          if (booksWithCovers.length > 0) {
            // Pick a book with cover
            const book = booksWithCovers[0];
            uniqueIds.add(book.key);
            allBooks.push(parseOpenLibraryBook(book, allBooks.length));
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch ${genre} books from author ${author}:`, error);
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    // If we don't have enough books, try fallback with more popular authors
    if (allBooks.length < totalBooks) {
      const topAuthors = [
        "Stephen King",
        "J.K. Rowling",
        "George R.R. Martin",
        "Isaac Asimov",
        "Agatha Christie",
        "Jane Austen",
      ];

      for (const author of topAuthors) {
        if (allBooks.length >= totalBooks) break;
        try {
          const url = `https://openlibrary.org/search.json?author=${encodeURIComponent(author)}&limit=5&has_fulltext=true`;
          const response = await fetch(url, {
            method: "GET",
            headers: { Accept: "application/json" },
          });

          if (response.ok) {
            const result = await response.json();
            const books = result.docs || [];

            for (const book of books) {
              if (allBooks.length >= totalBooks) break;
              if (book.cover_i && !uniqueIds.has(book.key)) {
                uniqueIds.add(book.key);
                allBooks.push(parseOpenLibraryBook(book, allBooks.length));
              }
            }
          }
        } catch (error) {
          console.warn(`Fallback: Failed to fetch from ${author}:`, error);
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(
      `✅ Fetched ${allBooks.length} popular books with covers from famous authors`
    );
    return allBooks.slice(0, totalBooks);
  } catch (error) {
    console.error("❌ Error fetching random genre books:", error);
    return [];
  }
}

/**
 * Fetch books from Open Library API
 * @param {string} category - Book category/subject to search
 * @param {number} limit - Number of books to fetch
 * @returns {Promise<Array>} Array of parsed book objects
 */
async function fetchBooksFromOpenLibrary(category, limit = 4) {
  try {
    let url;
    let response;
    let books = [];

    // For "recent" category, fetch from popular contemporary authors
    // Large pool of popular authors - randomly shuffled each load
    if (category === "recent") {
      const allRecentAuthors = [
        // Contemporary romance & fantasy
        "Sarah J. Maas",
        "Colleen Hoover",
        "Rebecca Yarros",
        "Brandon Sanderson",
        "Rick Riordan",
        "Kerri Maniscalco",
        "Emily Henry",
        "Kristin Hannah",
        "Celeste Ng",
        "Sally Rooney",
        "Freida McFadden",
        "Lucy Foley",
        "Ali Hazelwood",
        "Taylor Jenkins Reid",
        "Abby Jimenez",
        "Christina Lauren",
        "Tara Ison",
        "Laura Dave",
        "Katherine Center",
        "Jasmine Guillory",
        // Popular fantasy/sci-fi
        "N.K. Jemisin",
        "Patrick Rothfuss",
        "V.E. Schwab",
        "Naomi Novik",
        "China Mieville",
        "Pierce Brown",
        "Marie Rutkoski",
        "Sarah M. Cradit",
        "Sylvia Moreno-Garcia",
        // Mystery/thriller
        "Tana French",
        "Ruth Ware",
        "Paula Hawkins",
        "B.P. Walter",
        "Alex Finlay",
        "Greer Hendricks",
        "John Marrs",
        "Cara Hunter",
        "Rosamund Lupton",
        "C.L. Taylor",
        // General fiction bestsellers
        "Colleen Oakley",
        "Alice Hoffman",
        "Kristina McMorris",
        "Pam Jenoff",
        "Jennifer McGowan",
        "Beatriz Bracher",
      ];

      // Shuffle authors array to get random selection each refresh
      const shuffledAuthors = allRecentAuthors
        .sort(() => Math.random() - 0.5)
        .slice(0, limit + 2); // Get slightly more than needed

      const allBooks = [];
      const uniqueIds = new Set();

      for (const author of shuffledAuthors) {
        if (allBooks.length >= limit) break;

        try {
          const authorUrl = `https://openlibrary.org/search.json?author=${encodeURIComponent(author)}&limit=5&has_fulltext=true`;
          const authorResponse = await fetch(authorUrl, {
            method: "GET",
            headers: { Accept: "application/json" },
          });

          if (authorResponse.ok) {
            const result = await authorResponse.json();
            const authorBooks = result.docs || [];

            // Filter for books with covers
            for (const book of authorBooks) {
              if (allBooks.length >= limit) break;
              if (book.cover_i && !uniqueIds.has(book.key)) {
                uniqueIds.add(book.key);
                allBooks.push(parseOpenLibraryBook(book, allBooks.length));
              }
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch recent books from ${author}:`, error);
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log(`✅ Fetched ${allBooks.length} recent books from popular authors`);
      return allBooks.slice(0, limit);
    }

    // Map categories to Open Library search queries
    if (category === "fiction") {
      url = `https://openlibrary.org/search.json?subject=fiction&limit=${limit * 3}&has_fulltext=true`;
    } else if (category === "popular") {
      url = `https://openlibrary.org/search.json?has_fulltext=true&sort=rating&limit=${limit}`;
    } else {
      // For any other genre, use it as a subject
      url = `https://openlibrary.org/search.json?subject=${encodeURIComponent(category)}&limit=${limit * 2}&has_fulltext=true`;
    }

    console.log(`Fetching ${category} books from: ${url}`);

    response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    books = result.docs || [];

    if (books.length === 0) {
      console.warn(`⚠️ No books found for category: ${category}`);
      return [];
    }

    // Prioritize books with covers
    if (books.length > limit) {
      const booksWithCovers = books.filter((book) => book.cover_i);
      if (booksWithCovers.length >= limit) {
        books = booksWithCovers.slice(0, limit);
      } else {
        // Mix covered books with others if not enough
        books = [
          ...booksWithCovers,
          ...books.filter((b) => !b.cover_i),
        ].slice(0, limit);
      }
    } else {
      books = books.slice(0, limit);
    }

    // Parse and transform books
    const parsedBooks = books.map((book, index) =>
      parseOpenLibraryBook(book, index)
    );

    console.log(
      `✅ Fetched ${parsedBooks.length} ${category} books from Open Library`
    );
    return parsedBooks;
  } catch (error) {
    console.error(
      `❌ Error fetching ${category} books from Open Library:`,
      error
    );
    return [];
  }
}

/**
 * Fetch popular/bestselling books with good cover images
 * Uses well-known authors and searches that reliably return books with covers
 * @param {number} limit - Number of books to fetch
 * @returns {Promise<Array>} Array of popular book objects
 */
async function fetchPopularBooks(limit = 4) {
  try {
    const allBooks = [];
    const uniqueIds = new Set();

    // List of famous authors known to have well-covered books on Open Library
    const popularAuthors = [
      "Stephen King",
      "J.K. Rowling",
      "George R.R. Martin",
      "Haruki Murakami",
      "Agatha Christie",
      "J.R.R. Tolkien",
      "Isaac Asimov",
    ];

    // List of bestselling book titles/series that have good covers
    const popularSearches = [
      "Harry Potter",
      "The Great Gatsby",
      "1984",
      "To Kill a Mockingbird",
      "Dune",
      "The Hobbit",
      "Pride and Prejudice",
    ];

    // Mix searches - use some authors, some titles
    const searchQueries = [
      { type: "author", query: popularAuthors[Math.floor(Math.random() * popularAuthors.length)] },
      { type: "title", query: popularSearches[Math.floor(Math.random() * popularSearches.length)] },
      { type: "author", query: popularAuthors[Math.floor(Math.random() * popularAuthors.length)] },
      { type: "title", query: popularSearches[Math.floor(Math.random() * popularSearches.length)] },
    ];

    // Fetch books for each search query
    for (const search of searchQueries) {
      if (allBooks.length >= limit) break;

      try {
        let url;
        if (search.type === "author") {
          url = `https://openlibrary.org/search.json?author=${encodeURIComponent(search.query)}&limit=3`;
        } else {
          url = `https://openlibrary.org/search.json?title=${encodeURIComponent(search.query)}&limit=3`;
        }

        console.log(`Fetching popular books from ${search.type}: ${search.query}`);

        const response = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) continue;

        const result = await response.json();
        const books = result.docs || [];

        // Filter for books with covers and add to collection
        for (const book of books) {
          if (allBooks.length >= limit) break;

          // Prefer books with cover images
          if (book.cover_i && !uniqueIds.has(book.key)) {
            uniqueIds.add(book.key);
            allBooks.push(parseOpenLibraryBook(book, allBooks.length));
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${search.type} ${search.query}:`, error);
        continue;
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (allBooks.length === 0) {
      console.warn("⚠️ No popular books found, falling back to general fiction");
      return await fetchBooksFromOpenLibrary("fiction", limit);
    }

    console.log(`✅ Fetched ${allBooks.length} popular books from Open Library`);
    return allBooks.slice(0, limit);
  } catch (error) {
    console.error("❌ Error fetching popular books from Open Library:", error);
    // Fallback to general fiction search
    return await fetchBooksFromOpenLibrary("fiction", limit);
  }
}

/**
 * Parse Open Library book data into our format
 * @param {Object} book - Raw book object from Open Library API
 * @param {number} index - Book index
 * @returns {Object} Parsed book object
 */
function parseOpenLibraryBook(book, index) {
  const coverUrl = book.cover_i
    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
    : null;

  const quality = ["New", "Like New", "Very Good", "Good", "Fair"][
    Math.floor(Math.random() * 5)
  ];

  // Generate realistic prices
  const originalPrice = Math.floor(Math.random() * (2000 - 800) + 800);
  const discountedPrice = Math.floor(originalPrice * (0.4 + Math.random() * 0.3));

  return {
    id: book.key || book.isbn_0?.[0] || `book-${index}-${Math.random()}`,
    title: book.title || "Unknown Title",
    author: book.author_name?.[0] || "Unknown Author",
    image:
      coverUrl ||
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iNDUwIj48cmVjdCBmaWxsPSIjZjNmNGY2IiB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNmI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiPkJvb2sgQ292ZXI8L3RleHQ+PC9zdmc+",
    quality,
    price: discountedPrice,
    originalPrice: originalPrice,
    rating: (Math.random() * (5 - 3) + 3).toFixed(1),
    isNewBook: book.first_publish_year && book.first_publish_year > 2020,
  };
}

/**
 * Render books in the hero section
 * @param {Array} books - Array of book objects
 */
function renderHeroBooks(books) {
  const heroImagesContainer = document.querySelector(".hero-images");
  if (!heroImagesContainer) return;

  // Create two columns
  const columns = [[], []];
  books.forEach((book, index) => {
    columns[index % 2].push(book);
  });

  // Clear existing content and rebuild with API books
  heroImagesContainer.innerHTML = columns
    .map(
      (columnBooks) =>
        `<div class="column ${columnBooks === columns[0] ? "first-column" : "second-column"}">
        ${columnBooks
          .map(
            (book) => `
          <div class="book-card" data-book-id="${book.id}" style="cursor: pointer;">
            <img src="${book.image}" alt="${book.title}" class="hero-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iNDUwIj48cmVjdCBmaWxsPSIjZjNmNGY2IiB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNmI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiPkJvb2sgQ292ZXI8L3RleHQ+PC9zdmc+';" />
            <h4>${book.title}</h4>
            <p class="author">by ${book.author}</p>
            <p class="new-price">₱${book.price.toLocaleString("en-PH")}</p>
            <p class="old-price"><del>₱${book.originalPrice.toLocaleString("en-PH")}</del></p>
          </div>
        `
          )
          .join("")}
      </div>`
    )
    .join("");

  // Add click handlers to hero book cards
  document.querySelectorAll(".hero-images .book-card").forEach((card) => {
    card.addEventListener("click", function () {
      const bookId = this.getAttribute("data-book-id");
      if (bookId) {
        window.location.href = `pages/book-details.html?id=${bookId}`;
      }
    });
  });

  console.log("✅ Rendered hero books from Open Library API");
}

/**
 * Render books in the New Releases section
 * @param {Array} books - Array of book objects
 */
function renderNewReleases(books) {
  const booksGrid = document.querySelector(".new-releases .books-grid");
  if (!booksGrid) return;

  booksGrid.innerHTML = books
    .map(
      (book) => {
        const daysAgo = Math.floor(Math.random() * 5) + 1;
        const dayText = daysAgo > 1 ? "s" : "";
        return `
    <article class="book-card" data-book-id="${book.id}" style="cursor: pointer;">
      <div class="badge new-release">
        <i class="fas fa-tag"></i> ${daysAgo} day${dayText} ago
      </div>
      <figure class="book-image book-clickable">
        <img src="${book.image}" alt="${book.title}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iNDUwIj48cmVjdCBmaWxsPSIjZjNmNGY2IiB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNmI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiPkJvb2sgQ292ZXI8L3RleHQ+PC9zdmc+';" />
      </figure>
      <h3>${book.title}</h3>
      <p class="author">${book.author}</p>
      <p class="price">₱${book.price.toLocaleString("en-PH")} <span class="original-price">₱${book.originalPrice.toLocaleString("en-PH")}</span></p>
      <p class="rating">${book.rating} ★</p>
      <div class="book-actions">
        <button class="btn btn-dark add-to-cart">
          <i class="fas fa-shopping-cart"></i> Add to Cart
        </button>
        <a href="pages/book-details.html?id=${book.id}" class="btn btn-outline-secondary view-book">View</a>
      </div>
    </article>
  `;
      }
    )
    .join("");

  console.log("✅ Rendered new releases from Open Library API");

  // Add click handlers to navigate to book details
  document
    .querySelectorAll(".new-releases .book-card")
    .forEach((card) => {
      card.addEventListener("click", function (event) {
        // Only navigate if not clicking the buttons
        if (
          !event.target.classList.contains("btn") &&
          !event.target.closest(".btn")
        ) {
          const bookId = this.getAttribute("data-book-id");
          if (bookId) {
            window.location.href = `pages/book-details.html?id=${bookId}`;
          }
        }
      });
    });

  // Re-initialize cart listeners for newly added buttons
  initCartFunctionality();
}

/**
 * Render books in the Featured Books section
 * @param {Array} books - Array of book objects
 */
function renderFeaturedBooks(books) {
  const booksGrid = document.querySelector(".featured-section .books-grid");
  if (!booksGrid) return;

  booksGrid.innerHTML = books
    .map(
      (book) => `
    <article class="book-card" data-book-id="${book.id}" style="cursor: pointer;">
      <div class="badge featured-books">Featured</div>
      <figure class="book-image book-clickable">
        <img src="${book.image}" alt="${book.title}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iNDUwIj48cmVjdCBmaWxsPSIjZjNmNGY2IiB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNmI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiPkJvb2sgQ292ZXI8L3RleHQ+PC9zdmc+';" />
      </figure>
      <h3>${book.title}</h3>
      <p class="author">${book.author}</p>
      <p class="price">₱${book.price.toLocaleString("en-PH")} <span class="original-price">₱${book.originalPrice.toLocaleString("en-PH")}</span></p>
      <p class="rating">${book.rating} ★</p>
      <div class="book-actions">
        <button class="btn btn-dark add-to-cart">
          <i class="fas fa-shopping-cart"></i> Add to Cart
        </button>
        <a href="pages/book-details.html?id=${book.id}" class="btn btn-outline-secondary view-book">View</a>
      </div>
    </article>
  `
    )
    .join("");

  console.log("✅ Rendered featured books from Open Library API");

  // Add click handlers to navigate to book details
  document
    .querySelectorAll(".featured-section .book-card")
    .forEach((card) => {
      card.addEventListener("click", function (event) {
        // Only navigate if not clicking the buttons
        if (
          !event.target.classList.contains("btn") &&
          !event.target.closest(".btn")
        ) {
          const bookId = this.getAttribute("data-book-id");
          if (bookId) {
            window.location.href = `pages/book-details.html?id=${bookId}`;
          }
        }
      });
    });

  // Re-initialize cart listeners for newly added buttons
  initCartFunctionality();
}

