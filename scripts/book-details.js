// Book Details Page Script

console.log("book-details.js loaded successfully");

const API_BASE_URL = "http://localhost:5000/api";

// Store book data in session for quick access
let currentBook = null;
let quantity = 1;
let currentImageIndex = 0;
let bookImages = [];
let touchStartX = 0;
let touchStartY = 0;

// Load book details on page load
document.addEventListener("DOMContentLoaded", async function () {
  const bookId = getBookIdFromUrl();

  if (!bookId) {
    showError();
    return;
  }

  await loadBookDetails(bookId);
  initializeEventListeners();
  initializeCarousel();
  updateCartBadge();
});

// Get book ID from URL
function getBookIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

// Initialize carousel controls
function initializeCarousel() {
  const prevBtn = document.getElementById("prevImageBtn");
  const nextBtn = document.getElementById("nextImageBtn");
  const carousel = document.getElementById("bookImageCarousel");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => showPreviousImage());
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => showNextImage());
  }

  // Touch swipe support
  if (carousel) {
    carousel.addEventListener("touchstart", (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    });

    carousel.addEventListener("touchend", (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Only trigger swipe if horizontal movement is greater than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          showPreviousImage();
        } else {
          showNextImage();
        }
      }
    });
  }
}

// Show previous image
function showPreviousImage() {
  if (bookImages.length === 0) return;
  currentImageIndex = (currentImageIndex - 1 + bookImages.length) % bookImages.length;
  updateImageDisplay();
}

// Show next image
function showNextImage() {
  if (bookImages.length === 0) return;
  currentImageIndex = (currentImageIndex + 1) % bookImages.length;
  updateImageDisplay();
}

// Update image display
function updateImageDisplay() {
  const coverImg = document.getElementById("bookCoverImage");
  const counter = document.getElementById("imageCounter");

  if (bookImages.length === 0) return;

  const currentImage = bookImages[currentImageIndex];
  let imageSrc = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iNDUwIj48cmVjdCBmaWxsPSIjZjNmNGY2IiB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNmI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiPkJvb2sgQ292ZXI8L3RleHQ+PC9zdmc+";

  if (currentImage) {
    let imageUrl = null;

    // Handle different image formats
    if (typeof currentImage === 'string') {
      // Image is a plain string URL
      imageUrl = currentImage;
    } else if (typeof currentImage === 'object' && currentImage.url) {
      // Image is an object with a url property
      imageUrl = currentImage.url;
    }

    // Validate and use the URL
    if (imageUrl && (imageUrl.startsWith("http") || imageUrl.startsWith("data:"))) {
      imageSrc = imageUrl;
      console.log(`Displaying image ${currentImageIndex + 1}/${bookImages.length}:`, imageUrl.substring(0, 100));
    } else {
      console.warn(`Invalid image URL at index ${currentImageIndex}:`, imageUrl);
    }
  }

  coverImg.src = imageSrc;

  // Update counter
  if (counter && bookImages.length > 1) {
    counter.textContent = `${currentImageIndex + 1}/${bookImages.length}`;
  }
}

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
  // Initialize images array
  currentImageIndex = 0;
  bookImages = [];

  // Handle multiple images or single image
  if (book.images && Array.isArray(book.images) && book.images.length > 0) {
    // Filter out invalid images and extract URLs
    bookImages = book.images
      .filter(img => {
        if (typeof img === 'string') return img.length > 0;
        if (typeof img === 'object' && img.url) return img.url.length > 0;
        return false;
      })
      .map(img => {
        if (typeof img === 'string') return { url: img };
        return img;
      });

    console.log(`Loaded ${bookImages.length} images for carousel`);
  } else if (book.image) {
    // Fallback to single image
    let imageObj;
    if (typeof book.image === 'object' && book.image.url) {
      imageObj = book.image;
    } else if (typeof book.image === 'string') {
      imageObj = { url: book.image };
    }
    if (imageObj && imageObj.url) {
      bookImages = [imageObj];
      console.log('Loaded single image as fallback');
    }
  }

  // Setup carousel controls visibility
  const prevBtn = document.getElementById("prevImageBtn");
  const nextBtn = document.getElementById("nextImageBtn");
  const counter = document.getElementById("imageCounter");

  if (bookImages.length > 1) {
    if (prevBtn) prevBtn.style.display = "block";
    if (nextBtn) nextBtn.style.display = "block";
    if (counter) counter.style.display = "block";
    console.log(`Carousel initialized with ${bookImages.length} images`);
  } else {
    if (prevBtn) prevBtn.style.display = "none";
    if (nextBtn) nextBtn.style.display = "none";
    if (counter) counter.style.display = "none";
  }

  // Display first image
  updateImageDisplay();

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
      const cartItem = {
        title: currentBook.title,
        author: currentBook.author,
        price: `₱${currentBook.price}`,
        image: currentBook.image,
        quantity: 1,
        condition: currentBook.quality || "Good",
        seller: "Sold by Re;Read",
      };

      // Include bookFile if it exists (for digital books)
      if (currentBook.bookFile) {
        cartItem.bookFile = currentBook.bookFile;
        cartItem.isDigital = true;
      }

      cart.push(cartItem);
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
