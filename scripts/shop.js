// Shop page script — books database and UI functions

console.log("shop.js loaded successfully");

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Books Database - fetched from API
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
  special: null,
};
let isLoadingBooks = false;

// Default placeholder image (safe SVG - no external requests)
const DEFAULT_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iNDUwIj48cmVjdCBmaWxsPSIjZjNmNGY2IiB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNmI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiPkJvb2sgQ292ZXI8L3RleHQ+PC9zdmc+';

// Fetch books from API
async function fetchBooksFromAPI() {
  if (isLoadingBooks) return;

  isLoadingBooks = true;
  try {
    const response = await fetch(`${API_BASE_URL}/books`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      booksDatabase = result.data.map((book) => ({
        id: book._id,
        title: book.title || 'Unknown Title',
        author: book.author || 'Unknown Author',
        genre: book.genre || 'General',
        quality: book.quality || book.condition || 'Good',
        price: Number(book.price) || 0,
        originalPrice: Number(book.originalPrice) || Number(book.price) || 0,
        rating: Number(book.rating) || 0,
        image: validateImageUrl(book.image),
        featured: Boolean(book.featured) || false,
        isNewBook: Boolean(book.isNewBook) || false,
      }));

      filteredBooks = [...booksDatabase];
      console.log(`✅ Loaded ${booksDatabase.length} books from API`);
      console.log('📚 Sample book:', booksDatabase[0]);
      return true;
    } else if (result.success && (!result.data || result.data.length === 0)) {
      console.warn('⚠️ No books found in database');
      booksDatabase = [];
      filteredBooks = [];
      return true; // Still a success, just empty
    } else {
      console.error('❌ Failed to fetch books:', result.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('❌ Error fetching books:', error);
    booksDatabase = [];
    filteredBooks = [];
    return false;
  } finally {
    isLoadingBooks = false;
  }
}

// Validate and return safe image URL
function validateImageUrl(imageUrl) {
  if (!imageUrl || imageUrl === null || imageUrl === undefined || imageUrl.trim() === '') {
    return DEFAULT_PLACEHOLDER;
  }

  const url = String(imageUrl).trim();

  // Only allow http/https/data URIs
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }

  // Anything else gets the default placeholder :)
  return DEFAULT_PLACEHOLDER;
}

// Initialize shop page
document.addEventListener("DOMContentLoaded", async function () {
  const booksGrid = document.getElementById("booksGrid");
  if (booksGrid) {
    booksGrid.innerHTML = `
      <div class="loading-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
        <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #6b7280; margin-bottom: 16px;"></i>
        <h3 style="color: #6b7280;">Loading books...</h3>
      </div>
    `;
  }

  const success = await fetchBooksFromAPI();

  if (success) {
    initShopPage();
  } else {
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

  const urlParams = new URLSearchParams(window.location.search);
  const genreParam = urlParams.get("genre");
  const filterParam = urlParams.get("filter");
  const searchParam = urlParams.get("search");
  const hasUrlFilter = Boolean(genreParam || filterParam || searchParam);

  currentPage = 1;

  // Apply URL filters
  if (genreParam) {
    activeFilters.genre = genreParam;
    const genreLink = document.querySelector(`[data-genre="${genreParam}"]`);
    if (genreLink) {
      document.querySelectorAll("[data-genre]").forEach((l) => l.classList.remove("active"));
      genreLink.classList.add("active");
      const genreBtn = document.querySelector('.filter-btn[data-filter="genre"]');
      if (genreBtn) genreBtn.childNodes[0].textContent = genreParam + " ";
    }
  } else {
    const defaultGenre = document.querySelector('[data-genre="all"]');
    if (defaultGenre) defaultGenre.classList.add("active");
  }

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

  const defaultQuality = document.querySelector('[data-quality="all"]');
  const defaultPrice = document.querySelector('[data-price="all"]');
  if (defaultQuality) defaultQuality.classList.add("active");
  if (defaultPrice) defaultPrice.classList.add("active");

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
      const imageSrc = (book.image && (book.image.startsWith("http") || book.image.startsWith("data:")))
        ? book.image
        : DEFAULT_PLACEHOLDER;

      const safeTitle = (book.title || 'Unknown').replace(/'/g, "\\'");
      const safeAuthor = (book.author || 'Unknown').replace(/'/g, "\\'");

      return `
    <article class="book-card" data-id="${book.id}" data-genre="${book.genre}" data-quality="${book.quality}" data-price="${book.price}">
      <div class="badge">${book.quality}</div>
      <figure class="book-image">
        <img src="${imageSrc}" alt="${safeTitle}" loading="lazy" onerror="this.src='${DEFAULT_PLACEHOLDER}'; this.style.opacity='1';">
      </figure>
      <h3>${safeTitle}</h3>
      <p class="author">${safeAuthor}</p>
      <p class="price">₱${book.price} <span class="original-price">₱${book.originalPrice}</span></p>
      <p class="rating">${book.rating} ★</p>
      <div class="book-actions">
        <button class="btn btn-dark add-to-cart" data-book-id="${book.id}" data-book-title="${safeTitle}" data-book-author="${safeAuthor}" data-book-price="${book.price}" data-book-image="${imageSrc}" data-book-quality="${book.quality || ''}">
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

// Add book to cart
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
    // Ensure image is always valid
    const cartImage = validateImageUrl(bookData.image);

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
  const bookIdStr = String(bookId);
  const book = booksDatabase.find((b) => String(b.id) === bookIdStr);
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
    const cartImage = validateImageUrl(book.image);

    cart.push({
      title: book.title,
      author: book.author,
      price: `₱${book.price}`,
      image: cartImage,
      quantity: 1,
      condition: book.quality || "Good",
      seller: "Sold by Re;Read",
    });
  }

  localStorage.setItem("rereadCart", JSON.stringify(cart));
  updateCartBadge();
  showNotification(`${book.title} added to cart!`, "success");
}

function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem("rereadCart")) || [];
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const badges = document.querySelectorAll("#cartBadge, #cartBadgeMobile");

  badges.forEach((badge) => {
    badge.textContent = count;
    badge.setAttribute("data-count", count);
  });
}

function initFilters() {
  console.log("Initializing shop filters...");

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
      if (btn) btn.innerHTML = `${displayText} <i class="fas fa-chevron-down"></i>`;
    } else if (quality) {
      activeFilters.quality = quality;
      const btn = document.querySelector('.filter-btn[data-filter="quality"]');
      const displayText = quality === "all" ? "Quality" : target.textContent.trim();
      if (btn) btn.innerHTML = `${displayText} <i class="fas fa-chevron-down"></i>`;
    } else if (price) {
      activeFilters.price = price;
      const btn = document.querySelector('.filter-btn[data-filter="price"]');
      const displayText = price === "all" ? "Price" : target.textContent.trim();
      if (btn) btn.innerHTML = `${displayText} <i class="fas fa-chevron-down"></i>`;
    } else if (sort) {
      activeFilters.sort = sort;
      document.getElementById("currentSort").textContent = target.textContent.trim();
    }

    if (genre || quality || price || sort) {
      activeFilters.special = null;
    }

    const parentDropdown = target.closest(".filter-dropdown-content, .sort-dropdown-content");
    if (parentDropdown) {
      parentDropdown.querySelectorAll("a").forEach((l) => l.classList.remove("active"));
      target.classList.add("active");
    }

    applyFilters();
    closeAllDropdowns();
  });

  const filterBtns = document.querySelectorAll(".filter-btn, .sort-btn");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const dropdown = this.parentElement;
      const isActive = dropdown.classList.contains("active");

      closeAllDropdowns();

      if (!isActive) {
        dropdown.classList.add("active");
      }
    });
  });

  document.addEventListener("click", closeAllDropdowns);
}

function closeAllDropdowns() {
  document.querySelectorAll(".filter-dropdown, .sort-dropdown").forEach((dropdown) => {
    dropdown.classList.remove("active");
  });
}

// Apply all filters
function applyFilters(resetPage = true) {
  filteredBooks = booksDatabase.filter((book) => {
    if (activeFilters.genre !== "all" && book.genre !== activeFilters.genre) return false;
    if (activeFilters.quality !== "all" && book.quality !== activeFilters.quality) return false;

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

    if (activeFilters.special) {
      if (activeFilters.special === "featured" && !book.featured) return false;
      if (activeFilters.special === "new" && !book.isNewBook) return false;
    }

    if (activeFilters.search) {
      const searchTerm = activeFilters.search.toLowerCase();
      const searchable = `${book.title} ${book.author} ${book.genre}`.toLowerCase();
      if (!searchable.includes(searchTerm)) return false;
    }

    return true;
  });

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
  }

  if (resetPage) currentPage = 1;
  console.log(`Filtered to ${filteredBooks.length} books`);
  renderBooks();
}

// Initialize search
function initSearch() {
  const searchInputs = document.querySelectorAll('[data-role="shop-search"]');
  if (searchInputs.length === 0) return;

  searchInputs.forEach((input) => {
    input.value = activeFilters.search;

    let searchTimeout;
    input.addEventListener("input", function () {
      clearTimeout(searchTimeout);
      const value = this.value.trim();

      searchTimeout = setTimeout(() => {
        activeFilters.search = value;
        activeFilters.special = null;
        applyFilters();
      }, 300);
    });
  });
}

// Initialize pagination
function initPagination() {
  // Handled by updatePagination()
}

// Update pagination UI
function updatePagination() {
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
  const pageNumbers = document.getElementById("pageNumbers");
  const prevBtn = document.querySelector(".prev-btn");
  const nextBtn = document.querySelector(".next-btn");

  if (!pageNumbers || !prevBtn || !nextBtn) return;

  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages || totalPages === 0;

  const paginationContainer = document.getElementById("pagination");

  paginationContainer.onclick = (event) => {
    const target = event.target.closest("button");
    if (!target) return;

    if (target.classList.contains("prev-btn") && currentPage > 1) {
      currentPage--;
    } else if (target.classList.contains("next-btn") && currentPage < totalPages) {
      currentPage++;
    } else if (target.classList.contains("page-number")) {
      const page = parseInt(target.dataset.page, 10);
      if (page !== currentPage) currentPage = page;
    }
    renderBooks();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  pageNumbers.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
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
