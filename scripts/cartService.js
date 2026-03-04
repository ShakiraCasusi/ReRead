/**
 * Cart Service - API integration for cart operations
 * Handles database cart for authenticated users
 */

const CartService = {
  API_BASE_URL: "http://localhost:5000/api",

  /**
   * Get authentication token
   */
  getAuthToken() {
    return (
      sessionStorage.getItem("accessToken") ||
      localStorage.getItem("accessToken") ||
      ""
    );
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getAuthToken();
  },

  isMongoId(value) {
    return /^[a-f\d]{24}$/i.test(String(value || ""));
  },

  async resolveBookId(bookId, title = "") {
    if (this.isMongoId(bookId)) {
      return bookId;
    }

    if (!title) {
      return null;
    }

    try {
      const response = await fetch(
        `${this.API_BASE_URL}/books?search=${encodeURIComponent(title)}`,
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const books = Array.isArray(data?.data) ? data.data : [];
      const exactMatch = books.find(
        (book) =>
          String(book.title || "").toLowerCase() ===
          String(title).toLowerCase(),
      );

      const candidate = exactMatch || books[0];
      const candidateId = candidate?._id || candidate?.id || null;

      if (this.isMongoId(candidateId)) {
        return candidateId;
      }

      return null;
    } catch (error) {
      console.warn("Failed to resolve bookId by title:", error);
      return null;
    }
  },

  /**
   * Get user ID from session
   */
  getUserId() {
    const userStr =
      sessionStorage.getItem("user") || sessionStorage.getItem("rereadUser");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.userId || user._id || user.id;
    }
    return null;
  },

  /**
   * Fetch cart from database
   */
  async fetchCartFromDB() {
    if (!this.isAuthenticated()) {
      console.log("Cart fetch skipped: not authenticated");
      return null;
    }

    try {
      const token = this.getAuthToken();
      console.log(
        "Fetching cart from DB with token:",
        token ? "token exists" : "no token",
      );

      const response = await fetch(`${this.API_BASE_URL}/cart`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Cart fetch response status:", response.status);

      const data = await response.json();
      console.log("Cart fetch response data:", data);

      if (data.success) {
        console.log(
          "Cart fetched successfully, items count:",
          data.data?.items?.length || 0,
        );
        return data.data;
      }
      console.warn("Cart fetch failed:", data.message);
      return null;
    } catch (error) {
      console.error("Error fetching cart from DB:", error);
      return null;
    }
  },

  /**
   * Add item to database cart
   */
  async addToCartDB(bookId, quantity = 1, title = "") {
    if (!this.isAuthenticated()) {
      return null;
    }

    try {
      const resolvedBookId = await this.resolveBookId(bookId, title);
      if (!resolvedBookId) {
        console.warn("Cart DB sync skipped: unable to resolve Mongo bookId", {
          originalBookId: bookId,
          title,
        });
        return null;
      }

      const normalizedQuantity = Number(quantity) || 1;
      if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 1) {
        console.warn("Cart DB sync skipped: invalid quantity", {
          quantity,
          normalizedQuantity,
        });
        return null;
      }

      const response = await fetch(`${this.API_BASE_URL}/cart/add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookId: resolvedBookId,
          quantity: normalizedQuantity,
        }),
      });

      const data = await response.json();

      if (data.success) {
        return data.data;
      }

      console.warn("Cart DB sync failed", {
        status: response.status,
        request: {
          bookId: resolvedBookId,
          quantity: normalizedQuantity,
          title,
        },
        response: data,
      });
      return null;
    } catch (error) {
      console.error("Error adding to cart DB:", error);
      return null;
    }
  },

  /**
   * Update item quantity in database cart
   */
  async updateCartItemDB(bookId, quantity, title = "") {
    if (!this.isAuthenticated()) {
      return null;
    }

    try {
      const resolvedBookId = await this.resolveBookId(bookId, title);
      if (!resolvedBookId) {
        return null;
      }

      const response = await fetch(`${this.API_BASE_URL}/cart/update`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookId: resolvedBookId, quantity }),
      });

      const data = await response.json();

      if (data.success) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error("Error updating cart item in DB:", error);
      return null;
    }
  },

  /**
   * Remove item from database cart
   */
  async removeFromCartDB(bookId, title = "") {
    if (!this.isAuthenticated()) {
      return null;
    }

    try {
      const resolvedBookId = await this.resolveBookId(bookId, title);
      if (!resolvedBookId) {
        return null;
      }

      const response = await fetch(`${this.API_BASE_URL}/cart/remove`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookId: resolvedBookId }),
      });

      const data = await response.json();

      if (data.success) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error("Error removing from cart DB:", error);
      return null;
    }
  },

  /**
   * Clear database cart
   */
  async clearCartDB() {
    if (!this.isAuthenticated()) {
      return null;
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/cart/clear`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error("Error clearing cart DB:", error);
      return null;
    }
  },

  /**
   * Fetch book details by ID
   */
  async fetchBookDetails(bookId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/books/${bookId}`);
      const data = await response.json();
      if (data.success && data.data) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching book details:", error);
      return null;
    }
  },

  /**
   * Convert DB cart item to display format
   * Maps Book model fields to cart display fields
   */
  convertCartItem(cartItem) {
    if (!cartItem) return null;

    const book =
      typeof cartItem.bookId === "object" && cartItem.bookId
        ? cartItem.bookId
        : typeof cartItem.book === "object" && cartItem.book
          ? cartItem.book
          : cartItem;

    if (typeof book !== "object") return null;

    // Handle image URL from either images array or image field
    let imageUrl = "../images/placeholder.jpg";
    if (book.images && Array.isArray(book.images) && book.images.length > 0) {
      imageUrl = book.images[0].url || imageUrl;
    } else if (book.image) {
      // Handle different image formats
      if (typeof book.image === "object" && book.image.url) {
        imageUrl = book.image.url;
      } else if (typeof book.image === "string") {
        imageUrl = book.image;
      }
    }

    // No proxy needed since we removed crossorigin attribute from img tags

    const converted = {
      _id: book._id || cartItem.bookId || cartItem._id || cartItem.id,
      bookId: book._id || cartItem.bookId || cartItem._id || cartItem.id,
      title: book.title || cartItem.title || "Unknown Title",
      author: book.author || "Unknown Author",
      price: `₱${Math.round(cartItem.priceAtTime || book.price || 0)}`,
      image: imageUrl,
      quantity: cartItem.quantity || 1,
      condition: book.quality || "Good", // quality from Book model
      seller: book.sellerName || "Re;Read",
    };
    console.log(`[cartService] Converted item: ${converted.title}`, converted);
    return converted;
  },

  /**
   * Create a proxy URL for S3 images to handle CORS issues
   */
  createImageProxyUrl(s3Url) {
    try {
      // Use btoa() for base64 encoding in browser
      const encodedUrl = btoa(unescape(encodeURIComponent(s3Url)));
      return `${this.API_BASE_URL}/books/image-proxy/${encodedUrl}`;
    } catch (error) {
      console.warn("Failed to create image proxy URL:", error);
      return s3Url; // Fall back to original S3 URL
    }
  },

  /**
   * Convert DB cart format to localStorage format (synchronous)
   */
  convertDBCartToLocal(dbCart) {
    if (!dbCart || !dbCart.items) {
      console.log("No cart items to convert");
      return [];
    }

    console.log(
      "Converting DB cart with",
      dbCart.items.length,
      "items (sync method)",
    );

    return dbCart.items
      .map((item, index) => {
        const converted = this.convertCartItem(item);
        if (converted) {
          console.log(`Item ${index} converted:`, converted.title);
        } else {
          console.warn(`Item ${index}: conversion returned null`);
        }
        return converted;
      })
      .filter(Boolean);
  },

  /**
   * Convert DB cart with fallback book fetching for unpopulated references
   */
  async convertDBCartToLocalWithFallback(dbCart) {
    if (!dbCart || !dbCart.items) {
      console.log("No cart items to convert");
      return [];
    }

    console.log(
      "Converting DB cart with",
      dbCart.items.length,
      "items (with fallback)",
    );
    if (dbCart.items.length > 0) {
      console.log(
        "[cartService] Raw first item:",
        JSON.stringify(dbCart.items[0]),
      );
    }

    const convertedItems = [];

    for (let index = 0; index < dbCart.items.length; index++) {
      const cartItem = dbCart.items[index];
      let bookData = cartItem.bookId;

      // If bookId is a string (not populated), fetch the book details
      if (typeof bookData === "string") {
        console.log(
          `Item ${index}: bookId not populated, fetching details for ${bookData}`,
        );
        const fetchedBook = await this.fetchBookDetails(bookData);
        if (fetchedBook) {
          bookData = fetchedBook;
        } else {
          console.warn(
            `Item ${index}: failed to fetch book details for ${cartItem.bookId}`,
          );
          bookData = {
            _id: cartItem.bookId,
            title: cartItem.title || "Unknown Title",
            author: cartItem.author || "Unknown Author",
            price: cartItem.priceAtTime || cartItem.price || 0,
            quality: cartItem.condition || "Good",
            image: cartItem.image,
            sellerName: cartItem.seller,
          };
        }
      }

      // Now convert with book data attached
      const tempItem = { bookId: bookData, ...cartItem };
      const converted = this.convertCartItem(tempItem);
      if (converted) {
        console.log(`Item ${index} converted:`, converted.title);
        convertedItems.push(converted);
      } else {
        console.warn(`Item ${index}: conversion returned null`);
      }
    }

    console.log("Conversion complete:", convertedItems.length, "items");
    return convertedItems;
  },

  /**
   * Convert localStorage cart format to DB format
   */
  convertLocalCartToDB(localCart) {
    if (!Array.isArray(localCart)) return [];

    return localCart.map((item) => ({
      bookId: item._id || item.bookId,
      quantity: item.quantity || 1,
      price: parseFloat(item.price?.toString().replace(/[₱,]/g, "") || 0),
    }));
  },

  /**
   * No-op sync for DB-only cart flow
   */
  async syncCartOnLogin() {
    if (!this.isAuthenticated()) {
      return { synced: false, reason: "not_authenticated" };
    }
    return { synced: true, reason: "db_only_mode", syncedCount: 0 };
  },

  /**
   * Get cart from DB for authenticated users
   */
  async getCart() {
    console.log("getCart() called, isAuthenticated =", this.isAuthenticated());

    if (!this.isAuthenticated()) {
      console.log("Not authenticated, returning empty cart");
      return [];
    }

    console.log("User is authenticated, fetching from DB...");
    const dbCart = await this.fetchCartFromDB();

    if (!dbCart) {
      console.warn("fetchCartFromDB returned null, returning empty cart");
      return [];
    }

    console.log("DB cart received, converting with fallback...");
    const dbItems = await this.convertDBCartToLocalWithFallback(dbCart);
    console.log("Converted DB items:", dbItems.length, "items");
    return dbItems;
  },

  /**
   * Save cart is a no-op in DB-only mode
   */
  async saveCart(cartItems) {
    console.log(
      "saveCart() ignored in DB-only mode; use add/update/remove DB methods",
      Array.isArray(cartItems) ? `(${cartItems.length} items passed)` : "",
    );
  },
};

// Make CartService available globally
window.CartService = CartService;

/**
 * Global utility to proxy S3 images through backend to handle CORS issues
 * Usage: Use in image src attributes or validation functions
 */
window.getProxiedImageUrl = function (imageUrl) {
  if (!imageUrl) return imageUrl;

  // Convert object format to string if needed
  let urlString =
    typeof imageUrl === "object" && imageUrl.url
      ? imageUrl.url
      : String(imageUrl);

  // Check if it's an S3 URL that needs proxying
  if (
    urlString &&
    urlString.includes(".s3.") &&
    urlString.includes("amazonaws")
  ) {
    try {
      const API_BASE_URL = "http://localhost:5000/api";
      const encodedUrl = btoa(unescape(encodeURIComponent(urlString)));
      return `${API_BASE_URL}/books/image-proxy/${encodedUrl}`;
    } catch (error) {
      console.warn("Failed to create proxy URL, using original:", error);
      return urlString;
    }
  }

  return urlString;
};
