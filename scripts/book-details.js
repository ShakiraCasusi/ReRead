// Book Details Page Script

console.log("book-details.js loaded successfully");

const API_BASE_URL = "http://localhost:5000/api";

// Get book ID from URL
function getBookIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

// Store book data in session for quick access
let currentBook = null;
let quantity = 1;

// Load book details on page load
document.addEventListener("DOMContentLoaded", async function () {
  const bookId = getBookIdFromUrl();

  if (!bookId) {
    showError();
    return;
  }

  await loadBookDetails(bookId);
  initializeEventListeners();
  updateCartBadge();
});

// Load book details from localStorage (books database)
async function loadBookDetails(bookId) {
  try {
    // Retrieve books database from shop.js or localStorage
    let allBooks = [];

    // Get from session storage
    const sessionBooks = sessionStorage.getItem("booksDatabase");
    if (sessionBooks) {
      allBooks = JSON.parse(sessionBooks);
    } else {
      // Fallback: load from API
      try {
        const response = await fetch(`${API_BASE_URL}/books`);
        if (response.ok) {
          const result = await response.json();
          allBooks = Array.isArray(result.data) ? result.data : [];
        }
      } catch (error) {
        console.warn("Could not fetch books from API:", error);
      }
    }

    // Find book by ID
    const book = allBooks.find((b) => String(b.id) === String(bookId));

    if (!book) {
      showError();
      return;
    }

    currentBook = book;
    displayBookDetails(book);
    hideLoadingState();
  } catch (error) {
    console.error("Error loading book details:", error);
    showError();
  }
}

// Display book details on the page
function displayBookDetails(book) {
  // Image
  const coverImg = document.getElementById("bookCoverImage");
  const imageSrc =
    book.image &&
    (book.image.startsWith("http") || book.image.startsWith("data:"))
      ? book.image
      : "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iNDUwIj48cmVjdCBmaWxsPSIjZjNmNGY2IiB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNmI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiPkJvb2sgQ292ZXI8L3RleHQ+PC9zdmc+";
  coverImg.src = imageSrc;
  coverImg.alt = book.title;

  // Title and Author
  document.getElementById("bookTitle").textContent = book.title;
  document.getElementById("bookAuthor").textContent = `by ${book.author}`;

  // Genre and metadata
  document.getElementById("bookGenre").textContent = book.genre;
  document.getElementById("bookGenreDetail").textContent = book.genre;

  // Year
  const yearElement = document.getElementById("bookYear");
  if (book.isNewBook) {
    yearElement.textContent = "(New Release)";
  } else {
    yearElement.textContent = "";
  }

  // Display description from book data - prioritize seller's description
  const descriptionElement = document.getElementById("bookDescription");
  if (book.description && book.description.trim()) {
    // Use description from the book listing
    descriptionElement.textContent = book.description;
  } else {
    // Fetch description from Open Library API as fallback
    fetchBookDescription(book);
  }

  // Display seller information
  const sellerElement = document.getElementById("bookSeller");
  if (book.sellerId) {
    // If sellerId is an object (populated from DB), use username
    if (typeof book.sellerId === "object" && book.sellerId.username) {
      sellerElement.textContent = `Sold by ${book.sellerId.username}`;
    } else {
      // Fallback to default
      sellerElement.textContent = "Sold by Re;Read";
    }
  }

  // Display course/subject if available
  if (book.course) {
    const courseRow = document.getElementById("courseRow");
    const courseElement = document.getElementById("bookCourse");
    courseElement.textContent = book.course;
    courseRow.style.display = "table-row";
  }

  // Price and Rating
  document.getElementById("bookPrice").textContent = book.price;
  document.getElementById("bookOriginalPrice").textContent =
    book.originalPrice || book.price;
  document.getElementById("bookRating").textContent = book.rating || 0;

  // Quality Badge
  const badge = document.getElementById("qualityBadge");
  badge.textContent = book.quality;
  badge.className = `badge badge-quality-${book.quality.toLowerCase().replace(/\s+/g, "-")}`;

  // Condition
  document.getElementById("bookCondition").textContent = book.quality;
}

// Fetch book description from Open Library API
async function fetchBookDescription(book) {
  try {
    const descriptionElement = document.getElementById("bookDescription");

    // Search for the book on Open Library to get its description
    const searchResponse = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author)}&limit=1`,
    );

    if (!searchResponse.ok) throw new Error("Failed to search for book");

    const searchResult = await searchResponse.json();

    if (searchResult.docs && searchResult.docs.length > 0) {
      const doc = searchResult.docs[0];

      // Try to get description from the search result
      if (doc.first_sentence && doc.first_sentence.length > 0) {
        descriptionElement.textContent = doc.first_sentence[0];
      } else if (doc.description) {
        // Handle if description is an object with 'value' property
        const desc =
          typeof doc.description === "string"
            ? doc.description
            : doc.description.value;
        descriptionElement.textContent = desc;
      } else {
        // Fetch more detailed info from the book's works endpoint
        const workKey = doc.key;
        const workResponse = await fetch(
          `https://openlibrary.org${workKey}.json`,
        );

        if (workResponse.ok) {
          const workData = await workResponse.json();

          if (workData.description) {
            const desc =
              typeof workData.description === "string"
                ? workData.description
                : workData.description.value;
            descriptionElement.textContent = desc;
          } else {
            setDefaultDescription(descriptionElement);
          }
        } else {
          setDefaultDescription(descriptionElement);
        }
      }
    } else {
      setDefaultDescription(descriptionElement);
    }
  } catch (error) {
    console.warn("Error fetching book description:", error);
    setDefaultDescription(document.getElementById("bookDescription"));
  }
}

// Set default description if API fails
function setDefaultDescription(element) {
  element.textContent = `A wonderful book available at Re;Read. "${element.parentElement.parentElement.querySelector("h1").textContent}" by ${document.getElementById("bookAuthor").textContent.replace("by ", "")} is part of our curated collection of quality second-hand books. Discover why readers love this book and add it to your collection today.`;
}

// Hide loading state and show content
function hideLoadingState() {
  document.getElementById("loadingState").style.display = "none";
  document.getElementById("bookDetailsContainer").style.display = "block";
}

// Show error state
function showError() {
  document.getElementById("loadingState").style.display = "none";
  document.getElementById("errorState").style.display = "block";
}

// Initialize event listeners
function initializeEventListeners() {
  // Quantity controls
  document.getElementById("increaseQty").addEventListener("click", () => {
    quantity++;
    document.getElementById("quantityInput").value = quantity;
  });

  document.getElementById("decreaseQty").addEventListener("click", () => {
    if (quantity > 1) {
      quantity--;
      document.getElementById("quantityInput").value = quantity;
    }
  });

  // Add to cart button
  document
    .getElementById("addToCartBtn")
    .addEventListener("click", addCurrentBookToCart);

  // Wishlist button
  document
    .querySelector(".btn-outline-secondary:has(i.fa-heart)")
    .addEventListener("click", () => {
      showNotification("Added to wishlist!", "success");
    });
}

// Add current book to cart
function addCurrentBookToCart() {
  if (!currentBook) {
    showError("Error", "Book data not found");
    return;
  }

  const cart = JSON.parse(localStorage.getItem("rereadCart")) || [];

  // Add quantity times
  for (let i = 0; i < quantity; i++) {
    const existingItem = cart.find((item) => item.title === currentBook.title);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        title: currentBook.title,
        author: currentBook.author,
        price: `₱${currentBook.price}`,
        image: currentBook.image,
        quantity: 1,
        condition: currentBook.quality || "Good",
        seller: "Sold by Re;Read",
      });
    }
  }

  localStorage.setItem("rereadCart", JSON.stringify(cart));
  updateCartBadge();
  showNotification(
    `${quantity}x ${currentBook.title} added to cart!`,
    "success",
  );

  // Reset quantity
  quantity = 1;
  document.getElementById("quantityInput").value = 1;
}

// Update cart badge
function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem("rereadCart")) || [];
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const badges = document.querySelectorAll("#cartBadge, #cartBadgeMobile");

  badges.forEach((badge) => {
    badge.textContent = count;
    badge.setAttribute("data-count", count);
  });
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
