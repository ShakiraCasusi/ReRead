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
          mobileCartLink.nextSibling
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
      ".section-header, .books-grid, .stats, article, .book-card"
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
    { threshold: 0.3 }
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
    "search"
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
    'a[href]:not([href^="#"]):not([href^="mailto:"]):not([href^="tel:"])'
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
    ".add-to-cart, .btn-add-to-cart"
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
      item.querySelector(".quantity span")?.textContent || "1"
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
    ".summary-row:last-of-type span"
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
