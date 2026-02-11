// Shop page script — books database and UI functions

console.log("shop.js loaded successfully");

// API Configuration
const API_BASE_URL = "http://localhost:5000/api";

// Books Database - fetched from API
let booksDatabase = [];
let availableGenres = new Set(); // Track genres from API
let localBooks = [];
let openLibraryBooks = [];

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
const DEFAULT_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iNDUwIj48cmVjdCBmaWxsPSIjZjNmNGY2IiB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNmI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiPkJvb2sgQ292ZXI8L3RleHQ+PC9zdmc+";

function titleCase(value) {
  return String(value)
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeGenreName(value) {
  if (!value) return "General";
  const raw = String(value).trim();
  const normalized = raw.toLowerCase();

  if (normalized === "all") return "all";

  const map = {
    romance: "Romance",
    adventure: "Adventure",
    business: "Business",
    education: "Education",
    financial: "Financial",
    "financial literacy": "Financial",
    memoir: "Memoir",
    biography: "Memoir",
    "self-help": "Self-Help",
    "self help": "Self-Help",
    spiritual: "Spiritual",
    spirituality: "Spiritual",
    women: "Women",
    "science fiction": "Science Fiction",
    scifi: "Science Fiction",
    mystery: "Mystery",
    thriller: "Mystery",
    horror: "Horror",
    history: "History",
    fantasy: "Fantasy",
    fiction: "Fiction",
    general: "General",
  };

  return map[normalized] || titleCase(raw);
}

// Genre list for comprehensive loading
const GENRES_TO_LOAD = [
  "fiction",
  "romance",
  "adventure",
  "mystery",
  "science fiction",
  "fantasy",
  "horror",
  "thriller",
  "business",
  "education",
  "self-help",
  "biography",
  "memoir",
  "history",
  "science",
  "spirituality",
];

// Validate and return safe image URL
function validateImageUrl(imageUrl) {
  if (!imageUrl || imageUrl === null || imageUrl === undefined) {
    return DEFAULT_PLACEHOLDER;
  }

  // Handle object format with .url property (from database)
  let urlString;
  if (typeof imageUrl === 'object' && imageUrl.url) {
    urlString = String(imageUrl.url).trim();
  } else {
    urlString = String(imageUrl).trim();
  }

  // Only allow http/https/data URIs
  if (
    urlString.startsWith("http://") ||
    urlString.startsWith("https://") ||
    urlString.startsWith("data:")
  ) {
    return urlString;
  }

  return DEFAULT_PLACEHOLDER;
}

// Map Open Library subjects to ReRead genre categories
function mapOpenLibraryGenre(subjects) {
  if (!subjects || !Array.isArray(subjects) || subjects.length === 0)
    return "General";

  const subject = String(subjects[0]).toLowerCase();

  // Romance
  if (subject.includes("romance") || subject.includes("love stories"))
    return "Romance";

  // Adventure
  if (subject.includes("adventure") || subject.includes("journeys"))
    return "Adventure";

  // Business
  if (subject.includes("business") || subject.includes("entrepreneurship"))
    return "Business";

  // Education
  if (
    subject.includes("education") ||
    subject.includes("learning") ||
    subject.includes("academic")
  )
    return "Education";

  // Financial
  if (
    subject.includes("finance") ||
    subject.includes("money") ||
    subject.includes("investing")
  )
    return "Financial";

  // Memoir/Biography
  if (
    subject.includes("biography") ||
    subject.includes("memoir") ||
    subject.includes("autobiography")
  )
    return "Memoir";

  // Self-Help
  if (
    subject.includes("self-help") ||
    subject.includes("personal development") ||
    subject.includes("psychology")
  )
    return "Self-Help";

  // Spiritual
  if (
    subject.includes("spiritual") ||
    subject.includes("religion") ||
    subject.includes("faith") ||
    subject.includes("mindfulness")
  )
    return "Spiritual";

  // Women
  if (subject.includes("women") || subject.includes("feminist")) return "Women";

  // Science Fiction
  if (subject.includes("science fiction")) return "Science Fiction";

  // Mystery/Thriller
  if (
    subject.includes("mystery") ||
    subject.includes("thriller") ||
    subject.includes("detective")
  )
    return "Mystery";

  // Horror
  if (subject.includes("horror") || subject.includes("scary")) return "Horror";

  // History
  if (subject.includes("history")) return "History";

  return "General";
}

// Generate prices based on quality
function generatePricesByQuality(quality) {
  let originalPrice, discountedPrice;

  switch (quality) {
    case "New":
      originalPrice = Math.floor(Math.random() * (2000 - 1500) + 1500); // 1500-2000
      discountedPrice = Math.floor(Math.random() * (400 - 350) + 350); // 350-400
      break;
    case "Like New":
      originalPrice = Math.floor(Math.random() * (1800 - 1200) + 1200); // 1200-1800
      discountedPrice = Math.floor(Math.random() * (380 - 300) + 300); // 300-380
      break;
    case "Very Good":
      originalPrice = Math.floor(Math.random() * (1500 - 900) + 900); // 900-1500
      discountedPrice = Math.floor(Math.random() * (280 - 220) + 220); // 220-280
      break;
    case "Good":
      originalPrice = Math.floor(Math.random() * (1200 - 600) + 600); // 600-1200
      discountedPrice = Math.floor(Math.random() * (200 - 150) + 150); // 150-200
      break;
    case "Fair":
      originalPrice = Math.floor(Math.random() * (800 - 500) + 500); // 500-800
      discountedPrice = Math.floor(Math.random() * (150 - 100) + 100); // 100-150
      break;
    default:
      originalPrice = 1000;
      discountedPrice = 250;
  }

  return { originalPrice, discountedPrice };
}

// Helper function to parse book data
function parseBook(book, index, fallbackGenre) {
  const coverUrl = book.cover_i
    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
    : null;

  const mappedGenreFromSubject = mapOpenLibraryGenre(book.subject);
  const mappedGenre =
    mappedGenreFromSubject === "General" && fallbackGenre
      ? normalizeGenreName(fallbackGenre)
      : mappedGenreFromSubject;
  availableGenres.add(mappedGenre); // Track this genre

  const quality = ["New", "Like New", "Very Good", "Good", "Fair"][
    Math.floor(Math.random() * 5)
  ];
  const { originalPrice, discountedPrice } = generatePricesByQuality(quality);

  return {
    id: book.key || book.isbn_0?.[0] || `book-${index}-${Math.random()}`,
    title: book.title || "Unknown Title",
    author: book.author_name?.[0] || "Unknown Author",
    genre: mappedGenre,
    subjects: book.subject || [],

    // Generated marketplace data
    quality: quality,
    price: discountedPrice, // Current selling price (100-499)
    originalPrice: originalPrice, // Original price (500-2000)
    rating: (Math.random() * (5 - 2.5) + 2.5).toFixed(1),

    image: validateImageUrl(coverUrl),
    featured: Math.random() < 0.15,
    isNewBook: book.first_publish_year && book.first_publish_year > 2020,
  };
}

function parseLocalBook(book, index) {
  const normalizedGenre = normalizeGenreName(book.genre || "General");
  availableGenres.add(normalizedGenre);

  const quality = book.quality || "Good";
  const originalPrice =
    typeof book.originalPrice === "number"
      ? book.originalPrice
      : Math.round((Number(book.price) || 0) * 2);

  return {
    id: book._id || `local-book-${index}`,
    title: book.title || "Unknown Title",
    author: book.author || "Unknown Author",
    genre: normalizedGenre,
    subjects: book.genre ? [book.genre] : [],

    quality,
    price: Number(book.price) || 0,
    originalPrice,
    rating:
      typeof book.rating === "number"
        ? book.rating
        : typeof book.averageRating === "number"
          ? book.averageRating
          : (Math.random() * (5 - 2.5) + 2.5).toFixed(1),

    image: validateImageUrl(book.image),
    featured: Boolean(book.featured),
    isNewBook: Boolean(book.isNewBook),
    description: book.description || "",
    course: book.course || "",
    sellerId: book.sellerId || null,
  };
}

function rebuildBooksDatabase() {
  booksDatabase = [...localBooks, ...openLibraryBooks];
  filteredBooks = [...booksDatabase];
}

async function fetchLocalBooks() {
  try {
    const response = await fetch(`${API_BASE_URL}/books`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();
    const books = Array.isArray(result.data) ? result.data : [];

    localBooks = books.map((book, index) => parseLocalBook(book, index));
    rebuildBooksDatabase();

    console.log(`✅ Loaded ${localBooks.length} local books from API`);
    return true;
  } catch (error) {
    console.warn("⚠️ Failed to load local books:", error.message);
    localBooks = [];
    rebuildBooksDatabase();
    return false;
  }
}

// Fetch books from API
async function fetchBooksFromAPI() {
  if (isLoadingBooks) return;

  isLoadingBooks = true;
  try {
    const allBooks = [];
    const uniqueIds = new Set();

    // If search is active, search for that term. Otherwise, load all genres
    if (activeFilters.search && activeFilters.search.trim().length > 0) {
      const query = activeFilters.search;
      try {
        const response = await fetch(
          `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=20`,
        );

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        if (result.docs && Array.isArray(result.docs)) {
          result.docs.forEach((book, index) => {
            if (!uniqueIds.has(book.key)) {
              uniqueIds.add(book.key);
              allBooks.push(parseBook(book, index));
            }
          });
        }
      } catch (searchError) {
        console.error("Search error:", searchError);
      }
    } else {
      // Load books from multiple genres
      for (const genre of GENRES_TO_LOAD) {
        try {
          const response = await fetch(
            `https://openlibrary.org/search.json?subject=${encodeURIComponent(genre)}&limit=5`,
          );
          if (!response.ok) continue;

          const result = await response.json();
          if (result.docs && Array.isArray(result.docs)) {
            result.docs.forEach((book, index) => {
              if (!uniqueIds.has(book.key)) {
                uniqueIds.add(book.key);
                allBooks.push(parseBook(book, index, genre));
              }
            });
          }
          console.log(
            `✅ Loaded ${result.docs?.length || 0} books from genre: ${genre}`,
          );
        } catch (error) {
          console.warn(`Failed to fetch ${genre}:`, error);
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    if (allBooks.length > 0) {
      openLibraryBooks = allBooks;
      rebuildBooksDatabase();
      console.log(
        `✅ Total loaded: ${booksDatabase.length} books from Open Library`,
      );
      console.log("📚 Available genres:", Array.from(availableGenres));
      console.log("📚 Sample book:", booksDatabase[0]);
      return true;
    } else {
      console.warn("⚠️ No books found");
      openLibraryBooks = [];
      rebuildBooksDatabase();
      return true;
    }
  } catch (error) {
    console.error("❌ Error fetching books from Open Library:", error);
    openLibraryBooks = [];
    rebuildBooksDatabase();
    return localBooks.length > 0;
  } finally {
    isLoadingBooks = false;
  }
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

  // Step 1: Set initial filters from URL parameters BEFORE fetching data.
  const urlParams = new URLSearchParams(window.location.search);
  const genreParam = urlParams.get("genre");
  const filterParam = urlParams.get("filter");
  const searchParam = urlParams.get("search");

  if (genreParam) {
    activeFilters.genre = normalizeGenreName(genreParam);
  }
  if (filterParam === "featured") {
    activeFilters.special = "featured";
  } else if (filterParam === "new") {
    activeFilters.special = "new";
  }
  if (searchParam) {
    activeFilters.search = searchParam;
  }

  // Step 2: Fetch local seeded books and Open Library results.
  await fetchLocalBooks();
  const success = await fetchBooksFromAPI();

  // Step 3: Initialize the page UI and render the fetched books.
  if (success || booksDatabase.length > 0) {
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

  // Initialize event listeners
  populateDynamicGenres(); // Add this line to populate genres from API
  initFilters();
  initSearch();
  initPagination();
  initAddToCartButtons();
  updateCartBadge();

  currentPage = 1;

  // Update UI elements to reflect the active filters that were set from the URL
  if (activeFilters.genre !== "all") {
    const genreLink = document.querySelector(
      `[data-genre="${activeFilters.genre}"]`,
    );
    if (genreLink) {
      document
        .querySelectorAll("[data-genre]")
        .forEach((l) => l.classList.remove("active"));
      genreLink.classList.add("active");
      const genreBtn = document.querySelector(
        '.filter-btn[data-filter="genre"]',
      );
      if (genreBtn)
        genreBtn.innerHTML = `${genreLink.textContent.trim()} <i class="fas fa-chevron-down"></i>`;
    }
  } else {
    const defaultGenre = document.querySelector('[data-genre="all"]');
    if (defaultGenre) defaultGenre.classList.add("active");
  }

  if (activeFilters.search) {
    const searchInputs = document.querySelectorAll('[data-role="shop-search"]');
    if (searchInputs.length > 0) {
      searchInputs.forEach((input) => (input.value = activeFilters.search));
    }
  }

  // Set default active states for other filters
  const defaultQuality = document.querySelector('[data-quality="all"]');
  const defaultPrice = document.querySelector('[data-price="all"]');
  if (defaultQuality) defaultQuality.classList.add("active");
  if (defaultPrice) defaultPrice.classList.add("active");

  // Data is fetched, now apply filters and render the initial view.
  applyFilters(true); // Pass true to reset to page 1
}

// Populate genre filter with available genres from API
function populateDynamicGenres() {
  const genreDropdown = document.getElementById("genreFilterDropdown");
  if (!genreDropdown) return;

  // Get unique genres from availableGenres Set and sort them
  const sortedGenres = Array.from(availableGenres).sort();

  // Clear and rebuild dropdown
  genreDropdown.innerHTML = '<a href="#" data-genre="all">All Genres</a>';

  sortedGenres.forEach((genre) => {
    if (genre !== "General") {
      // Skip 'General' unless it has many books
      const link = document.createElement("a");
      link.href = "#";
      link.dataset.genre = genre;
      link.textContent = genre;
      genreDropdown.appendChild(link);
    }
  });
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

  // Store books database in sessionStorage for quick access on details page
  sessionStorage.setItem("booksDatabase", JSON.stringify(booksDatabase));

  booksGrid.innerHTML = booksToShow
    .map((book) => {
      const imageSrc = validateImageUrl(book.image);

      const safeTitle = (book.title || "Unknown").replace(/'/g, "\\'");
      const safeAuthor = (book.author || "Unknown").replace(/'/g, "\\'");

      return `
    <article class="book-card" data-id="${book.id}" data-genre="${book.genre}" data-quality="${book.quality}" data-price="${book.price}" data-book-url="book-details.html?id=${book.id}">
      <div class="badge">${book.quality}</div>
      <figure class="book-image">
        <img src="${imageSrc}" alt="${safeTitle}" loading="lazy" onerror="this.src='${DEFAULT_PLACEHOLDER}'; this.style.opacity='1';">
      </figure>
      <h3>${safeTitle}</h3>
      <p class="author">${safeAuthor}</p>
      <p class="price">₱${book.price} <span class="original-price">₱${book.originalPrice}</span></p>
      <p class="rating">${book.rating} ★</p>
      <div class="book-actions">
        <button class="btn btn-dark add-to-cart" data-book-id="${book.id}" data-book-title="${safeTitle}" data-book-author="${safeAuthor}" data-book-price="${book.price}" data-book-image="${imageSrc}" data-book-quality="${book.quality || ""}">
          <i class="fas fa-shopping-cart"></i> Add to Cart
        </button>
        <a href="book-details.html?id=${book.id}" class="btn btn-outline-secondary view-book">View</a>
      </div>
    </article>
    `;
    })
    .join("");

  // Add click handler to entire book card
  document.querySelectorAll(".book-card").forEach((card) => {
    card.addEventListener("click", function (e) {
      // Don't navigate if clicking on action buttons
      if (
        e.target.closest(".book-actions") ||
        e.target.closest("button") ||
        e.target.closest("a")
      ) {
        return;
      }
      const url = this.dataset.bookUrl;
      if (url) {
        window.location.href = url;
      }
    });
  });

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
      console.error("Book ID not found in data attributes");
      showNotification("Error: Book ID not found", "error");
      return;
    }

    addBookToCart({
      id: bookId,
      title: bookTitle,
      author: bookAuthor,
      price: bookPrice,
      image: bookImage,
      quality: bookQuality,
    });
  });
}

// Add book to cart
function addBookToCart(bookData) {
  if (!bookData.title) {
    showNotification("Error: Invalid book data", "error");
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
      author: bookData.author,
      price: bookData.price.toString().startsWith("₱")
        ? bookData.price
        : `₱${bookData.price}`,
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
    console.error("Book not found:", bookId);
    showNotification("Book not found", "error");
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
      activeFilters.genre = normalizeGenreName(genre);
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

    if (genre || quality || price || sort) {
      activeFilters.special = null;
    }

    const parentDropdown = target.closest(
      ".filter-dropdown-content, .sort-dropdown-content",
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
  document
    .querySelectorAll(".filter-dropdown, .sort-dropdown")
    .forEach((dropdown) => {
      dropdown.classList.remove("active");
    });
}

// Apply all filters
function applyFilters(resetPage = true) {
  filteredBooks = booksDatabase.filter((book) => {
    // Genre filter - check both exact genre and subjects
    if (activeFilters.genre !== "all") {
      const filterGenre = normalizeGenreName(activeFilters.genre);
      const genreMatch = normalizeGenreName(book.genre) === filterGenre;
      const subjectMatch =
        book.subjects &&
        book.subjects.some(
          (subj) => mapOpenLibraryGenre([subj]) === filterGenre,
        );
      if (!genreMatch && !subjectMatch) return false;
    }

    if (
      activeFilters.quality !== "all" &&
      book.quality !== activeFilters.quality
    )
      return false;

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
      const searchable =
        `${book.title} ${book.author} ${book.genre}`.toLowerCase();
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

        // Reload from Open Library API with new search term
        const booksGrid = document.getElementById("booksGrid");
        if (booksGrid) {
          booksGrid.innerHTML =
            '<div class="loading-state" style="grid-column: 1/-1; text-align: center;"><i class="fas fa-spinner fa-spin"></i> Searching Open Library...</div>';
        }
        fetchBooksFromAPI().then(() => applyFilters());
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
    } else if (
      target.classList.contains("next-btn") &&
      currentPage < totalPages
    ) {
      currentPage++;
    } else if (target.classList.contains("page-number")) {
      const page = parseInt(target.dataset.page, 10);
      if (page && page !== currentPage) {
        currentPage = page;
      }
    }

    updatePagination();
    renderBooks();
  };

  // Initial pagination render
  pageNumbers.innerHTML = Array.from({ length: totalPages }, (_, i) => {
    const page = i + 1;
    return `<button class="page-number${page === currentPage ? " active" : ""}" data-page="${page}">${page}</button>`;
  }).join("");
}

// Update results count display
function updateResultsCount() {
  const resultsCount = document.getElementById("resultsCount");
  if (!resultsCount) return;

  resultsCount.textContent = filteredBooks.length;
}

// Show notification
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("fade-out");
  }, 3000);

  setTimeout(() => {
    notification.remove();
  }, 3500);
}

//# sourceMappingURL=shop.js.map
