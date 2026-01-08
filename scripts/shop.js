// Shop page script — books database and UI functions

console.log("shop.js loaded successfully");

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Books Database - will be populated from API
let booksDatabase = [];

// Global variables
let currentPage = 1;
const booksPerPage = 12;
const pageStorageKey = "shopCurrentPage";
let filteredBooks = [];
let activeFilters = {
  genre: "all",
  quality: "all",
  price: "all",
  sort: "featured",
  search: "",
  special: null, // For 'featured' or 'new' filters
};
let isLoadingBooks = false;

// Fetch books from API
async function fetchBooksFromAPI() {
  if (isLoadingBooks) return;

  isLoadingBooks = true;
  try {
    const response = await fetch(`${API_BASE_URL}/books`);
    const result = await response.json();

    if (result.success && result.data) {
      // Transform API data to match frontend structure
      booksDatabase = result.data.map((book, index) => ({
        id: book._id || index + 1,
        title: book.title,
        author: book.author,
        genre: book.genre,
        quality: book.quality || book.condition,
        price: book.price,
        originalPrice: book.originalPrice || book.price,
        rating: book.rating || 0,
        image: book.image || book.imageUrl || 'https://via.placeholder.com/300x450/f3f4f6/6b7280?text=Book+Cover',
        featured: book.featured || false,
        isNew: book.isNewBook || false,
      }));

      // Initialize filteredBooks with all books
      filteredBooks = [...booksDatabase];
      console.log(`✅ Loaded ${booksDatabase.length} books from API`);
      return true;
    } else {
      console.error('Failed to fetch books:', result.message);
      return false;
    }
  } catch (error) {
    console.error('Error fetching books:', error);
    // Fallback to empty array - UI will show "No books found"
    booksDatabase = [];
    filteredBooks = [];
    return false;
  } finally {
    isLoadingBooks = false;
  }
}

// Initialize shop page
document.addEventListener("DOMContentLoaded", async function () {
  // Show loading state
  const booksGrid = document.getElementById("booksGrid");
  if (booksGrid) {
    booksGrid.innerHTML = `
      <div class="loading-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
        <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #6b7280; margin-bottom: 16px;"></i>
        <h3 style="color: #6b7280;">Loading books...</h3>
      </div>
    `;
  }

  // Fetch books from API
  const success = await fetchBooksFromAPI();

  if (success) {
    initShopPage();
  } else {
    // Show error state
    if (booksGrid) {
      booksGrid.innerHTML = `
        <div class="error-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
          <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ef4444; margin-bottom: 16px;"></i>
          <h3 style="color: #ef4444;">Failed to load books</h3>
          <p style="color: #6b7280; margin-top: 8px;">Please check your connection and try again.</p>
          <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 16px;">Retry</button>
        </div>
      `;
    }
  }
});

function initShopPage() {
  console.log("initShopPage() called");

  initFilters();
  initSearch();
  initPagination();
  initAddToCartButtons();
  updateCartBadge();

  // Read URL parameters for auto-filtering
  const urlParams = new URLSearchParams(window.location.search);
  const genreParam = urlParams.get("genre");
  const filterParam = urlParams.get("filter");
  const searchParam = urlParams.get("search");
  const hasUrlFilter = Boolean(genreParam || filterParam || searchParam);

  // Always start at page 1 when the page is initialized.
  currentPage = 1;

  console.log("URL params:", { genre: genreParam, filter: filterParam });

  // Apply URL filters if present
  if (genreParam) {
    activeFilters.genre = genreParam;
    const genreLink = document.querySelector(`[data-genre="${genreParam}"]`);
    if (genreLink) {
      document
        .querySelectorAll("[data-genre]")
        .forEach((l) => l.classList.remove("active"));
      genreLink.classList.add("active");

      // Update button text
      const genreBtn = document.querySelector(
        '.filter-btn[data-filter="genre"]'
      );
      if (genreBtn) {
        genreBtn.childNodes[0].textContent = genreParam + " ";
      }
    }
  } else {
    const defaultGenre = document.querySelector('[data-genre="all"]');
    if (defaultGenre) defaultGenre.classList.add("active");
  }

  // Apply special filters (Featured, New)
  if (filterParam === "featured") {
    activeFilters.special = "featured";
  } else if (filterParam === "new") {
    activeFilters.special = "new";
  }

  if (searchParam) {
    activeFilters.search = searchParam;
    const searchInputs = document.querySelectorAll('[data-role="shop-search"]');
    if (searchInputs.length > 0) {
      searchInputs.forEach((input) => (input.value = searchParam));
    }
  }

  // Set default active filters
  const defaultQuality = document.querySelector('[data-quality="all"]');
  const defaultPrice = document.querySelector('[data-price="all"]');

  if (defaultQuality) defaultQuality.classList.add("active");
  if (defaultPrice) defaultPrice.classList.add("active");

  console.log("Shop page initialized with filters:", activeFilters);

  applyFilters(!hasUrlFilter);
}

// Render books on page
function renderBooks() {
  const booksGrid = document.getElementById("booksGrid");
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);

  if (totalPages === 0) {
    booksGrid.innerHTML = `
      <div class="no-results">
        <i class="fas fa-search"></i>
        <h3>No books found</h3>
        <p>Try adjusting your filters or search terms</p>
      </div>
    `;
    updateResultsCount();
    updatePagination();
    return;
  }

  if (currentPage > totalPages) currentPage = totalPages;

  localStorage.setItem(pageStorageKey, String(currentPage));

  const startIndex = (currentPage - 1) * booksPerPage;
  const endIndex = startIndex + booksPerPage;
  const booksToShow = filteredBooks.slice(startIndex, endIndex);

  booksGrid.innerHTML = booksToShow
    .map((book) => {
      const imageSrc = book.image.startsWith("http")
        ? book.image
        : `../images/${book.image}`;
      return `
    <article class="book-card" data-id="${book.id}" data-genre="${book.genre}" data-quality="${book.quality}" data-price="${book.price}">
      <div class="badge">${book.quality}</div>
      <figure class="book-image">
        <img src="${imageSrc}" alt="" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450/f3f4f6/6b7280?text=Book+Cover'; this.style.opacity='1';">
      </figure>
      <h3>${book.title}</h3>
      <p class="author">${book.author}</p>
      <p class="price">₱${book.price} <span class="original-price">₱${book.originalPrice}</span></p>
      <p class="rating">${book.rating} ★</p>
      <div class="book-actions">
        <button class="btn btn-dark add-to-cart" data-book-id="${book.id}" data-book-title="${book.title}" data-book-author="${book.author}" data-book-price="${book.price}" data-book-image="${book.image || ''}" data-book-quality="${book.quality || ''}">
          <i class="fas fa-shopping-cart"></i> Add to Cart
        </button>
        <a href="#" class="btn btn-outline-secondary view-book">View</a>
      </div>
    </article>
    `;
    })
    .join("");

  updateResultsCount();
  updatePagination();
}

// Initialize add-to-cart button event listeners
function initAddToCartButtons() {
  const booksGrid = document.getElementById("booksGrid");
  if (!booksGrid) return;

  booksGrid.addEventListener("click", function (e) {
    const addToCartBtn = e.target.closest(".add-to-cart");
    if (!addToCartBtn) return;

    e.preventDefault();
    const bookId = addToCartBtn.dataset.bookId;
    const bookTitle = addToCartBtn.dataset.bookTitle;
    const bookAuthor = addToCartBtn.dataset.bookAuthor;
    const bookPrice = addToCartBtn.dataset.bookPrice;
    const bookImage = addToCartBtn.dataset.bookImage;
    const bookQuality = addToCartBtn.dataset.bookQuality;

    if (!bookId) {
      console.error('Book ID not found in data attributes');
      showNotification('Error: Book ID not found', "error");
      return;
    }

    addBookToCart({
      id: bookId,
      title: bookTitle,
      author: bookAuthor,
      price: bookPrice,
      image: bookImage,
      quality: bookQuality
    });
  });
}

// Add book to cart (new function to use data attributes)
function addBookToCart(bookData) {
  if (!bookData.title) {
    showNotification('Error: Invalid book data', "error");
    return;
  }

  const cart = JSON.parse(localStorage.getItem("rereadCart")) || [];
  const existingItem = cart.find((item) => item.title === bookData.title);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    // Use correct image path for cart
    let cartImage = bookData.image;
    if (cartImage && !cartImage.startsWith("http")) {
      cartImage = cartImage ? `images/${cartImage}` : 'https://via.placeholder.com/300x450/f3f4f6/6b7280?text=Book+Cover';
    } else if (!cartImage) {
      cartImage = 'https://via.placeholder.com/300x450/f3f4f6/6b7280?text=Book+Cover';
    }

    cart.push({
      title: bookData.title,
      author: bookData.author || "Unknown Author",
      price: bookData.price.toString().startsWith('₱') ? bookData.price : `₱${bookData.price}`,
      image: cartImage,
      quantity: 1,
      condition: bookData.quality || "Good",
      seller: "Sold by Re;Read",
    });
  }

  localStorage.setItem("rereadCart", JSON.stringify(cart));
  updateCartBadge();
  showNotification(`${bookData.title} added to cart!`, "success");
}

// Add to cart function
function addToCartFromShop(bookId) {
  // Convert bookId to string for reliable comparison
  const bookIdStr = String(bookId);
  const book = booksDatabase.find((b) => String(b.id) === bookIdStr || String(b._id) === bookIdStr);
  if (!book) {
    console.error('Book not found:', bookId);
    showNotification('Book not found', "error");
    return;
  }

  const cart = JSON.parse(localStorage.getItem("rereadCart")) || [];
  const existingItem = cart.find((item) => item.title === book.title);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    // Use correct image path for cart
    const cartImage = book.image && book.image.startsWith("http")
      ? book.image
      : book.image
        ? `images/${book.image}`
        : 'https://via.placeholder.com/300x450/f3f4f6/6b7280?text=Book+Cover';
    cart.push({
      title: book.title,
      author: book.author,
      price: `₱${book.price}`,
      image: cartImage,
      quantity: 1,
      condition: book.quality || book.condition,
      seller: "Sold by Re;Read",
    });
  }

  localStorage.setItem("rereadCart", JSON.stringify(cart));
  updateCartBadge();
  showNotification(`${book.title} added to cart!`, "success");
}

// Update cart badge
function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem("rereadCart")) || [];
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const badges = document.querySelectorAll("#cartBadge, #cartBadgeMobile");

  badges.forEach((badge) => {
    badge.textContent = count;
    badge.setAttribute("data-count", count);
    // Visibility is now handled by the global CSS rule: .cart-badge[data-count="0"]
  });
}

// Initialize filters
function initFilters() {
  console.log("Initializing shop filters...");

  // Genre filter
  const filterBar = document.querySelector(".filter-bar");
  if (!filterBar) return;

  filterBar.addEventListener("click", function (e) {
    const target = e.target.closest("a");
    if (!target) return;

    e.preventDefault();

    const genre = target.dataset.genre;
    const quality = target.dataset.quality;
    const price = target.dataset.price;
    const sort = target.dataset.sort;

    if (genre) {
      activeFilters.genre = genre;
      const btn = document.querySelector('.filter-btn[data-filter="genre"]');
      const displayText = genre === "all" ? "Genre" : target.textContent.trim();
      if (btn)
        btn.innerHTML = `${displayText} <i class="fas fa-chevron-down"></i>`;
    } else if (quality) {
      activeFilters.quality = quality;
      const btn = document.querySelector('.filter-btn[data-filter="quality"]');
      const displayText =
        quality === "all" ? "Quality" : target.textContent.trim();
      if (btn)
        btn.innerHTML = `${displayText} <i class="fas fa-chevron-down"></i>`;
    } else if (price) {
      activeFilters.price = price;
      const btn = document.querySelector('.filter-btn[data-filter="price"]');
      const displayText = price === "all" ? "Price" : target.textContent.trim();
      if (btn)
        btn.innerHTML = `${displayText} <i class="fas fa-chevron-down"></i>`;
    } else if (sort) {
      activeFilters.sort = sort;
      document.getElementById("currentSort").textContent =
        target.textContent.trim();
    }

    // Reset special filter if any main filter is used
    if (genre || quality || price || sort) {
      activeFilters.special = null;
    }

    // Update active class for the clicked link
    const parentDropdown = target.closest(
      ".filter-dropdown-content, .sort-dropdown-content"
    );
    if (parentDropdown) {
      parentDropdown
        .querySelectorAll("a")
        .forEach((l) => l.classList.remove("active"));
      target.classList.add("active");
    }

    applyFilters();
    closeAllDropdowns();
  });

  // Sort filter
  // This is now handled by the main event listener above

  // Dropdown toggle
  const filterBtns = document.querySelectorAll(".filter-btn, .sort-btn");
  console.log("Found filter buttons:", filterBtns.length);

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      console.log("Filter button clicked:", this.dataset.filter || "sort");

      const dropdown = this.parentElement;
      const isActive = dropdown.classList.contains("active");

      closeAllDropdowns();

      if (!isActive) {
        dropdown.classList.add("active");
        console.log("Dropdown opened");
      }
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener("click", closeAllDropdowns);
}

function closeAllDropdowns() {
  document
    .querySelectorAll(".filter-dropdown, .sort-dropdown")
    .forEach((dropdown) => {
      dropdown.classList.remove("active");
    });
}

// Apply all filters
function applyFilters(resetPage = true) {
  filteredBooks = booksDatabase.filter((book) => {
    // Genre filter
    if (activeFilters.genre !== "all" && book.genre !== activeFilters.genre) {
      return false;
    }

    // Quality filter
    if (
      activeFilters.quality !== "all" &&
      book.quality !== activeFilters.quality
    ) {
      return false;
    }

    // Price filter
    if (activeFilters.price !== "all") {
      const price = book.price;
      const range = activeFilters.price;

      if (range === "0-100" && price >= 100) return false;
      if (range === "100-200" && (price < 100 || price >= 200)) return false;
      if (range === "200-300" && (price < 200 || price >= 300)) return false;
      if (range === "300-500" && (price < 300 || price >= 500)) return false;
      if (range === "500-800" && (price < 500 || price >= 800)) return false;
      if (range === "800-1000" && (price < 800 || price >= 1000)) return false;
      if (range === "1000+" && price < 1000) return false;
    }

    // Special filters (Featured, New)
    if (activeFilters.special) {
      if (activeFilters.special === "featured" && !book.featured) {
        return false;
      }
      if (activeFilters.special === "new" && !book.isNewBook) {
        return false;
      }
    }

    // Search filter
    if (activeFilters.search) {
      const searchTerm = activeFilters.search.toLowerCase();
      const searchable =
        `${book.title} ${book.author} ${book.genre}`.toLowerCase();
      if (!searchable.includes(searchTerm)) {
        return false;
      }
    }

    return true;
  });

  // Apply sorting
  switch (activeFilters.sort) {
    case "price-low":
      filteredBooks.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      filteredBooks.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      filteredBooks.sort((a, b) => b.rating - a.rating);
      break;
    default: // featured
      // Keep original order
      break;
  }

  if (resetPage) currentPage = 1;
  console.log(`Filtered to ${filteredBooks.length} books`);
  renderBooks();
}

// Initialize search
function initSearch() {
  const searchInputs = document.querySelectorAll('[data-role="shop-search"]');
  if (searchInputs.length === 0) {
    return;
  }

  searchInputs.forEach((input) => {
    input.value = activeFilters.search;

    // Debounce search input
    let searchTimeout;
    input.addEventListener("input", function () {
      clearTimeout(searchTimeout);
      const value = this.value.trim();

      searchTimeout = setTimeout(() => {
        activeFilters.search = value;
        activeFilters.special = null; // Reset special filter

        // If search query is long enough, optionally search via API
        if (value.length >= 2) {
          searchBooksAPI(value);
        } else {
          applyFilters();
        }
      }, 300);
    });
  });
}

// Search books via API (optional enhancement)
async function searchBooksAPI(query) {
  try {
    const response = await fetch(`${API_BASE_URL}/books/search?query=${encodeURIComponent(query)}`);
    const result = await response.json();

    if (result.success && result.data) {
      // Transform and merge with local results
      const apiBooks = result.data.map((book, index) => ({
        id: book._id || `search-${index}`,
        title: book.title,
        author: book.author,
        genre: book.genre,
        quality: book.quality || book.condition,
        price: book.price,
        originalPrice: book.originalPrice || book.price,
        rating: book.rating || 0,
        image: book.image || book.imageUrl || 'https://via.placeholder.com/300x450/f3f4f6/6b7280?text=Book+Cover',
        featured: book.featured || false,
        isNew: book.isNewBook || false,
      }));

      // Apply filters to API results
      filteredBooks = apiBooks.filter(book => {
        // Apply current filters
        if (activeFilters.genre !== "all" && book.genre !== activeFilters.genre) return false;
        if (activeFilters.quality !== "all" && book.quality !== activeFilters.quality) return false;
        return true;
      });

      currentPage = 1;
      renderBooks();
    }
  } catch (error) {
    console.error('Error searching books:', error);
    // Fallback to local filtering
    applyFilters();
  }
}

// Initialize pagination
function initPagination() {
  // This function is now intentionally left blank.
  // All pagination logic is now handled by updatePagination() to ensure
  // event listeners are re-attached after every render.
}

// Update pagination UI
function updatePagination() {
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
  const pageNumbers = document.getElementById("pageNumbers");
  const prevBtn = document.querySelector(".prev-btn");
  const nextBtn = document.querySelector(".next-btn");

  if (!pageNumbers || !prevBtn || !nextBtn) return;

  // Update buttons state
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages || totalPages === 0;

  const paginationContainer = document.getElementById("pagination");

  // Use event delegation for the entire pagination container
  // This single listener handles prev, next, and page number clicks.
  paginationContainer.onclick = (event) => {
    const target = event.target.closest("button");
    if (!target) return;

    if (target.classList.contains("prev-btn") && currentPage > 1) {
      currentPage--;
    } else if (
      target.classList.contains("next-btn") &&
      currentPage < totalPages
    ) {
      currentPage++;
    } else if (target.classList.contains("page-number")) {
      const page = parseInt(target.dataset.page, 10);
      if (page !== currentPage) {
        currentPage = page;
      }
    }
    renderBooks();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Generate page numbers
  pageNumbers.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      const pageBtn = document.createElement("button");
      pageBtn.className = `page-number ${i === currentPage ? "active" : ""}`;
      pageBtn.dataset.page = i;
      pageBtn.textContent = i;
      pageNumbers.appendChild(pageBtn);
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      const ellipsis = document.createElement("span");
      ellipsis.textContent = "...";
      pageNumbers.appendChild(ellipsis);
    }
  }
}

// Update results count
function updateResultsCount() {
  const resultsCount = document.getElementById("resultsCount");
  resultsCount.textContent = filteredBooks.length;
}

// Show notification
function showNotification(message, type = "success") {
  const colors = {
    success: "#10b981",
    error: "#ef4444",
    info: "#3b82f6",
  };

  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type]};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    font-weight: 600;
    z-index: 1000;
    animation: slideIn 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
