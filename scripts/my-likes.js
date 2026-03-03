// My Likes Page - JavaScript

// Default placeholder image (safe SVG - no external requests)
const DEFAULT_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iNDUwIj48cmVjdCBmaWxsPSIjZjNmNGY2IiB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNmI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiPkJvb2sgQ292ZXI8L3RleHQ+PC9zdmc+";

let allLikes = [];
let filteredLikes = [];
let selectedLikeIds = [];
let searchQuery = "";

// Initialize header search functionality
function initHeaderSearch() {
  // Ensure search bar CSS has maximum priority and proper layering
  if (!document.querySelector("#search-bar-fix")) {
    const searchFixStyle = document.createElement("style");
    searchFixStyle.id = "search-bar-fix";
    searchFixStyle.textContent = `
      /* Ensure header is always on top with highest priority */
      .header {
        position: relative !important;
        z-index: 9999 !important;
        pointer-events: auto !important;
      }

      /* Search bar with maximum z-index priority */
      .search-bar {
        pointer-events: auto !important;
        display: flex !important;
        visibility: visible !important;
        z-index: 9999 !important;
        position: relative !important;
      }

      .search-bar input {
        display: block !important;
        visibility: visible !important;
        pointer-events: auto !important;
        cursor: text !important;
        z-index: 9999 !important;
        position: relative !important;
      }

      .search-bar input:focus,
      .search-bar input:hover {
        pointer-events: auto !important;
      }

      .search-bar i {
        pointer-events: none !important;
      }

      /* Ensure nav elements don't block header */
      nav {
        pointer-events: auto !important;
        z-index: 9998 !important;
      }

      nav * {
        pointer-events: auto !important;
      }

      /* Ensure wishlist overlay stays below header */
      .wishlist-actions-overlay {
        z-index: 20 !important;
      }
    `;
    document.head.appendChild(searchFixStyle);
  }

  // Get search inputs from header
  const searchInputs = document.querySelectorAll('[data-role="likes-search"]');

  if (searchInputs.length === 0) {
    console.warn("Search input not found");
    return;
  }

  // Add event listeners for search functionality
  searchInputs.forEach((input) => {
    // Force maximum z-index and interaction properties
    input.style.display = "block";
    input.style.pointerEvents = "auto";
    input.style.cursor = "text";
    input.style.zIndex = "9999";
    input.style.position = "relative";
    input.style.visibility = "visible";

    // Ensure placeholder is visible
    input.placeholder = "Search in likes...";

    // Handle Input event for real-time search
    input.addEventListener("input", function () {
      this.style.pointerEvents = "auto";
      this.style.cursor = "text";
      searchQuery = this.value.trim();
      applyFilters();
    });

    // Debug click events
    input.addEventListener("click", function (e) {
      console.log("Search input clicked:", e);
      this.focus();
    });

    // Debug mousedown events
    input.addEventListener("mousedown", function (e) {
      console.log("Search input mousedown:", e);
      this.focus();
    });

    // Visual feedback on focus
    input.addEventListener("focus", function () {
      console.log("Search input focused");
      this.style.borderColor = "#030213";
      this.style.boxShadow = "0 0 0 3px rgba(3, 2, 19, 0.1)";
    });

    input.addEventListener("blur", function () {
      this.style.borderColor = "";
      this.style.boxShadow = "";
    });
  });

  // Make sure the search bar wrapper has maximum priority
  const searchBars = document.querySelectorAll(".search-bar");
  searchBars.forEach((bar) => {
    bar.style.pointerEvents = "auto";
    bar.style.display = "flex";
    bar.style.visibility = "visible";
    bar.style.zIndex = "9999";
    bar.style.position = "relative";

    // Ensure all child elements allow pointer events
    bar.querySelectorAll("*").forEach((child) => {
      if (child.tagName !== "I") {
        // Except icons
        child.style.pointerEvents = "auto";
        child.style.zIndex = "9999";
      }
    });
  });

  // Ensure header has proper layering
  const header = document.querySelector(".header");
  if (header) {
    header.style.position = "relative";
    header.style.zIndex = "9999";
    header.style.pointerEvents = "auto";
  }

  // Ensure nav elements are interactive
  const nav = document.querySelector("nav");
  if (nav) {
    nav.style.pointerEvents = "auto";
    nav.style.zIndex = "9998";
  }

  console.log(
    "Search bar initialized with " +
      searchInputs.length +
      " input(s) - z-index: 9999",
  );
}

// Page initialization
document.addEventListener("DOMContentLoaded", async function () {
  console.log("My Likes page loaded");

  // Initialize header search FIRST to ensure search bar is interactive
  initHeaderSearch();

  // Load initial data
  await loadLikes();

  // Setup filter event listeners
  setupFilterListeners();

  // Setup search functionality
  setupSearch();

  // Update cart badge
  updateCartBadge();
});

// Load likes from localStorage
async function loadLikes() {
  try {
    const loadingState = document.getElementById("loadingState");
    const likesContainer = document.getElementById("likesContainer");
    const emptyState = document.getElementById("emptyState");
    const errorState = document.getElementById("errorState");

    // Show loading state
    loadingState.style.display = "block";
    likesContainer.style.display = "none";
    emptyState.style.display = "none";
    errorState.style.display = "none";

    // Get likes from localStorage
    const wishlist = JSON.parse(localStorage.getItem("rereadWishlist")) || [];
    allLikes = wishlist;

    // Hide loading state
    loadingState.style.display = "none";

    if (allLikes.length === 0) {
      emptyState.style.display = "block";
      updateStatistics();
      return;
    }

    // Show likes container and render
    likesContainer.style.display = "block";
    populateGenreFilter();
    applyFilters();
    updateStatistics();
  } catch (error) {
    console.error("Error loading likes:", error);
    const loadingState = document.getElementById("loadingState");
    const errorState = document.getElementById("errorState");
    loadingState.style.display = "none";
    errorState.style.display = "block";
  }
}

// Populate genre filter dynamically
function populateGenreFilter() {
  const genreFilter = document.getElementById("genreFilter");
  const genres = new Set();

  allLikes.forEach((book) => {
    if (book.genre) {
      genres.add(book.genre);
    }
  });

  const sortedGenres = Array.from(genres).sort();
  const currentValue = genreFilter.value;

  // Clear existing options except "All Genres"
  const options = genreFilter.querySelectorAll("option");
  options.forEach((option) => {
    if (option.value !== "all") {
      option.remove();
    }
  });

  // Add genre options
  sortedGenres.forEach((genre) => {
    const option = document.createElement("option");
    option.value = genre;
    option.textContent = genre;
    genreFilter.appendChild(option);
  });

  // Restore previous value if it still exists
  if (
    currentValue &&
    genreFilter.querySelector(`option[value="${currentValue}"]`)
  ) {
    genreFilter.value = currentValue;
  }
}

// Apply all filters
function applyFilters() {
  const genreFilter = document.getElementById("genreFilter").value;
  const priceFilter = document.getElementById("priceFilter").value;
  const typeFilter = document.getElementById("typeFilter").value;
  const sortFilter = document.getElementById("sortFilter").value;

  // Filter books
  filteredLikes = allLikes.filter((book) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const searchable =
        `${book.title || ""} ${book.author || ""} ${book.genre || ""}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }

    // Genre filter
    if (genreFilter !== "all" && book.genre !== genreFilter) return false;

    // Price filter
    const price = parseFloat(book.price) || 0;
    if (priceFilter === "500-1000" && (price < 500 || price >= 1000))
      return false;
    if (priceFilter === "1000+" && price < 1000) return false;

    // Type filter
    if (typeFilter !== "all") {
      const bookType = book.isDigital ? "Digital" : "Physical";
      if (bookType !== typeFilter) return false;
    }

    return true;
  });

  // Sort books
  switch (sortFilter) {
    case "newest":
      filteredLikes.reverse();
      break;
    case "oldest":
      // Already in original order
      break;
    case "price-low":
      filteredLikes.sort(
        (a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0),
      );
      break;
    case "price-high":
      filteredLikes.sort(
        (a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0),
      );
      break;
    case "title":
      filteredLikes.sort((a, b) =>
        (a.title || "").localeCompare(b.title || ""),
      );
      break;
  }

  renderLikes();
}

// Render likes in table
function renderLikes() {
  const likesTableBody = document.getElementById("likesTableBody");
  const likesContainer = document.getElementById("likesContainer");
  const emptyState = document.getElementById("emptyState");

  if (filteredLikes.length === 0) {
    likesContainer.style.display = "none";
    emptyState.style.display = "block";
    return;
  }

  likesContainer.style.display = "block";
  emptyState.style.display = "none";

  likesTableBody.innerHTML = filteredLikes
    .map((book, index) => {
      const price = book.price || "N/A";
      const priceDisplay =
        typeof price === "string" && price.startsWith("₱")
          ? price
          : `₱${price}`;
      const bookType = book.isDigital ? "Digital" : "Physical";
      const badgeClass = book.isDigital ? "type-digital" : "type-physical";
      const bookImage = book.image || DEFAULT_PLACEHOLDER;
      const safeTitle = book.title || "Untitled";
      const safeAuthor = book.author || "Unknown Author";
      const safeGenre = book.genre || "General";
      const bookId = book.id || `liked_${index}`;

      return `
                <tr data-like-id="${bookId}" data-like-index="${index}">
          <td style="text-align: center;">
            <input type="checkbox" class="form-check-input like-checkbox" value="${index}" 
              onchange="handleCheckboxChange()">
          </td>
          <td>
                        <img src="${bookImage}" alt="${safeTitle}" class="book-thumbnail" 
              onerror="this.src='${DEFAULT_PLACEHOLDER}'">
                    </td>
                    <td>
                        <div class="fw-semibold">${safeTitle}</div>
                    </td>
                    <td>${safeAuthor}</td>
                    <td>${priceDisplay}</td>
                    <td>${safeGenre}</td>
                    <td>
                        <span class="type-badge ${badgeClass}">${bookType}</span>
                    </td>
                    <td>
                        <div class="d-flex gap-2">
                            <button class="btn btn-view btn-sm" onclick="viewBook('${bookId}', ${index})" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-cart btn-sm" onclick="addLikeToCart(${index})" title="Add to Cart">
                <i class="fas fa-shopping-cart"></i>
              </button>
              <button class="btn btn-remove btn-sm" onclick="openRemoveModal(${index})" 
                title="Remove from Likes">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  updateStatistics();
}

// Handle checkbox changes
function handleCheckboxChange() {
  const checkboxes = document.querySelectorAll(".like-checkbox:checked");
  selectedLikeIds = Array.from(checkboxes).map((cb) => parseInt(cb.value));

  const bulkActionsBar = document.getElementById("bulkActionsBar");
  const selectedCount = document.getElementById("selectedCount");

  if (selectedLikeIds.length > 0) {
    bulkActionsBar.style.display = "block";
    selectedCount.textContent = `${selectedLikeIds.length} item${selectedLikeIds.length !== 1 ? "s" : ""} selected`;
    document.getElementById("selectAllCheckbox").checked =
      selectedLikeIds.length === filteredLikes.length;
  } else {
    bulkActionsBar.style.display = "none";
    document.getElementById("selectAllCheckbox").checked = false;
  }
}

// Toggle select all
function toggleSelectAll(checked) {
  document.querySelectorAll(".like-checkbox").forEach((cb) => {
    cb.checked = checked;
  });
  handleCheckboxChange();
}

// Deselect all
function deselectAll() {
  document.querySelectorAll(".like-checkbox").forEach((cb) => {
    cb.checked = false;
  });
  handleCheckboxChange();
}

// View book details
function viewBook(bookId, index) {
  // Navigate to book details page
  window.location.href = `book-details.html?id=${bookId || index}`;
}

// Add like to cart
function addLikeToCart(index) {
  const book = filteredLikes[index];
  if (!book) return;

  const cart = JSON.parse(localStorage.getItem("rereadCart")) || [];
  const existingItem = cart.find((item) => item.title === book.title);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    const cartItem = {
      title: book.title,
      author: book.author,
      price:
        typeof book.price === "string" && book.price.startsWith("₱")
          ? book.price
          : `₱${book.price}`,
      image: book.image || DEFAULT_PLACEHOLDER,
      quantity: 1,
      id: book.id,
    };
    cart.push(cartItem);
  }

  localStorage.setItem("rereadCart", JSON.stringify(cart));
  updateCartBadge();
  showNotification(`${book.title} added to cart!`, "success");
}

// Open remove modal
function openRemoveModal(index) {
  const book = filteredLikes[index];
  document.getElementById("removeBookTitle").textContent = book.title;
  document.getElementById("removeBookId").value = index;

  const removeModal = new bootstrap.Modal(
    document.getElementById("removeModal"),
  );
  removeModal.show();
}

// Confirm remove book
function confirmRemoveBook() {
  const index = parseInt(document.getElementById("removeBookId").value);
  removeFromLikes(index);

  const removeModal = bootstrap.Modal.getInstance(
    document.getElementById("removeModal"),
  );
  removeModal.hide();
}

// Remove from likes
function removeFromLikes(index) {
  const book = filteredLikes[index];

  // Remove from allLikes
  allLikes = allLikes.filter((b) => b.id !== book.id || b.title !== book.title);

  // Save to localStorage
  localStorage.setItem("rereadWishlist", JSON.stringify(allLikes));

  showNotification(`"${book.title}" removed from My Likes`, "info");

  // Reload page
  loadLikes();
}

// Open bulk remove modal
function openBulkRemoveModal() {
  const count = selectedLikeIds.length;
  document.getElementById("bulkRemoveCount").textContent =
    `${count} book${count !== 1 ? "s" : ""} `;

  const bulkRemoveModal = new bootstrap.Modal(
    document.getElementById("bulkRemoveModal"),
  );
  bulkRemoveModal.show();
}

// Confirm bulk remove
function confirmBulkRemove() {
  const selectedBooks = selectedLikeIds
    .map((index) => filteredLikes[index])
    .filter(Boolean);

  allLikes = allLikes.filter((book) => {
    return !selectedBooks.some(
      (selected) =>
        (selected.id && book.id && selected.id === book.id) ||
        (selected.title === book.title && selected.author === book.author),
    );
  });

  localStorage.setItem("rereadWishlist", JSON.stringify(allLikes));
  showNotification(
    `${selectedLikeIds.length} book${selectedLikeIds.length !== 1 ? "s" : ""} removed from My Likes`,
    "info",
  );

  const bulkRemoveModal = bootstrap.Modal.getInstance(
    document.getElementById("bulkRemoveModal"),
  );
  bulkRemoveModal.hide();

  // Reload page
  loadLikes();
}

// Update statistics
function updateStatistics() {
  const totalLiked = document.getElementById("totalLiked");
  const totalValue = document.getElementById("totalValue");
  const averagePrice = document.getElementById("averagePrice");
  const genreCount = document.getElementById("genreCount");

  const total = allLikes.length;
  const totalPrice = allLikes.reduce(
    (sum, book) => sum + (parseFloat(book.price) || 0),
    0,
  );
  const average = total > 0 ? totalPrice / total : 0;
  const genres = new Set(allLikes.map((b) => b.genre)).size;

  totalLiked.textContent = total;
  totalValue.textContent = `₱${totalPrice.toFixed(2)} `;
  averagePrice.textContent = `₱${average.toFixed(2)} `;
  genreCount.textContent = genres;
}

// Setup filter listeners
function setupFilterListeners() {
  // Filters already have onchange handlers in HTML
  // This function is for any additional setup if needed
  console.log("Filter listeners setup complete");
}

// Setup search functionality
function setupSearch() {
  const searchInput = document.getElementById("likesSearchInput");
  if (!searchInput) return;

  let searchTimeout;
  searchInput.addEventListener("input", function (e) {
    clearTimeout(searchTimeout);
    searchQuery = this.value.trim();

    searchTimeout = setTimeout(() => {
      applyFilters();
    }, 300);
  });

  // Handle Enter key for immediate search
  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      clearTimeout(searchTimeout);
      searchQuery = this.value.trim();
      applyFilters();
    }
  });

  // Ensure input is clickable and focused
  searchInput.style.pointerEvents = "auto";
  searchInput.style.cursor = "text";

  searchInput.addEventListener("click", function (e) {
    e.stopPropagation();
    this.focus();
  });

  console.log("Search functionality initialized for My Likes");
}

// Show notification
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
        position: fixed;
        top: 84px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6"};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 20000;
        animation: slideIn 0.3s ease-out;
        `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
  }, 3000);

  setTimeout(() => {
    notification.remove();
  }, 3500);
}

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
        @keyframes slideIn {
    from {
                transform: translateX(400px);
                opacity: 0;
            }
    to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOut {
    from {
                transform: translateX(0);
                opacity: 1;
            }
    to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
        `;
document.head.appendChild(style);

// Update cart badge count
function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem("rereadCart")) || [];
  const count = cart.reduce((total, item) => total + (item.quantity || 1), 0);
  const badges = document.querySelectorAll("#cartBadge, #cartBadgeMobile");

  badges.forEach((badge) => {
    badge.textContent = count;
    badge.setAttribute("data-count", count);
    if (count > 0) {
      badge.removeAttribute("hidden");
    } else {
      badge.setAttribute("hidden", "");
    }
  });
}

// Ensure Bootstrap is loaded
if (typeof bootstrap === "undefined") {
  console.warn("Bootstrap not loaded");
}
