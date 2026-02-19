// scripts/sell.js - JavaScript for the sell page

// Global variable to store uploaded images
window.uploadedImages = [];
// Global variable to store uploaded document file
window.uploadedFile = null;

document.addEventListener("DOMContentLoaded", async function () {
  await ensureUserIsSeller();
  initSellPage();
});

// Ensure user is registered as a seller
async function ensureUserIsSeller() {
  try {
    const token =
      sessionStorage.getItem("accessToken") ||
      localStorage.getItem("accessToken");
    if (!token) {
      window.location.href = "signin.html";
      return;
    }

    // Get current user profile
    const profileResponse = await fetch(
      "http://localhost:5000/api/auth/profile",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!profileResponse.ok) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      sessionStorage.removeItem("accessToken");
      window.location.href = "signin.html";
      return;
    }

    const profileData = await profileResponse.json();
    const user = profileData.data;

    // If user is not a seller, make them one
    if (!user.isSeller) {
      console.log("User is not a seller, registering...");

      // Register as seller with default values
      const sellerResponse = await fetch(
        "http://localhost:5000/api/auth/become-seller",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            storeName: user.firstName
              ? `${user.firstName}'s Store`
              : `${user.username}'s Store`,
            description: "Welcome to my bookstore!",
          }),
        },
      );

      if (!sellerResponse.ok) {
        console.error("Failed to register as seller");
        showError("Error", "Failed to register as seller. Please try again.");
      } else {
        const sellerData = await sellerResponse.json();
        console.log("Successfully registered as seller", sellerData);

        // Update stored tokens with new ones that include seller status
        if (sellerData.data && sellerData.data.accessToken) {
          sessionStorage.setItem("accessToken", sellerData.data.accessToken);
          localStorage.setItem("accessToken", sellerData.data.accessToken);
        }
        if (sellerData.data && sellerData.data.refreshToken) {
          sessionStorage.setItem("refreshToken", sellerData.data.refreshToken);
          localStorage.setItem("refreshToken", sellerData.data.refreshToken);
        }

        // Store updated user data with seller role (becomeSeller returns user object directly in data)
        if (sellerData.data) {
          const userData = {
            id: sellerData.data._id || sellerData.data.id,
            email: sellerData.data.email,
            username: sellerData.data.username,
            firstName: sellerData.data.firstName,
            lastName: sellerData.data.lastName,
            role: sellerData.data.role,
            isSeller: sellerData.data.isSeller,
          };
          sessionStorage.setItem("user", JSON.stringify(userData));
          localStorage.setItem("rereadUser", JSON.stringify(userData));
        }

        // Refresh auth UI to update navbar with seller role
        if (typeof authManager !== "undefined" && authManager) {
          authManager.user = sellerData.data;
          authManager.initAuthUI();
        }

        // Reload page after a short delay to ensure navbar reinitializes properly
        setTimeout(() => {
          location.reload();
        }, 500);
      }
    }
  } catch (error) {
    console.error("Error ensuring seller status:", error);
  }
}

function initSellPage() {
  initImageUpload();
  initFileUpload();
  initFormValidation();
  initPriceCalculator();
  initConditionSelector();
}

function initImageUpload() {
  const photoPlaceholder = document.querySelector(".photo-placeholder");
  const choosePhotosBtn = document.querySelector(".choose-photos-btn");

  if (photoPlaceholder) {
    photoPlaceholder.addEventListener("click", function () {
      // Create hidden file input
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.multiple = true;
      fileInput.accept = "image/*";

      fileInput.addEventListener("change", function (e) {
        handleImageSelection(e.target.files);
      });

      fileInput.click();
    });
  }

  if (choosePhotosBtn) {
    choosePhotosBtn.addEventListener("click", function (e) {
      e.preventDefault();
      photoPlaceholder.click();
    });
  }

  function handleImageSelection(files) {
    Array.from(files).forEach((file) => {
      if (window.uploadedImages.length >= 5) {
        showWarning("Maximum photos reached", "You can upload up to 5 photos");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        showError("File too large", `${file.name} exceeds 5MB limit`);
        return;
      }

      if (!file.type.startsWith("image/")) {
        showWarning("Invalid file type", `${file.name} is not an image`);
        return;
      }

      const reader = new FileReader();
      reader.onload = function (e) {
        const imageData = {
          file: file,
          url: e.target.result,
          name: file.name,
        };

        window.uploadedImages.push(imageData);
        displayUploadedImage(imageData);

        // Update placeholder text
        if (window.uploadedImages.length >= 1) {
          photoPlaceholder.innerHTML = `
                        <i class="fa-solid fa-check-circle"></i>
                        <p>${window.uploadedImages.length} photo(s) uploaded</p>
                        <small>Click to add more photos</small>
                    `;
          photoPlaceholder.style.background = "#f0fdf4";
          photoPlaceholder.style.border = "2px dashed #10b981";
        }
      };
      reader.readAsDataURL(file);
    });
  }

  function displayUploadedImage(imageData) {
    // Create image preview (you could customize this)
    console.log("Image uploaded:", imageData.name);
    // In a real implementation, you'd display thumbnails
  }
}

function initFileUpload() {
  const filePlaceholder = document.querySelector(".file-placeholder");
  const chooseFileBtn = document.querySelector(".choose-file-btn");

  if (filePlaceholder) {
    filePlaceholder.addEventListener("click", function () {
      // Create hidden file input
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".pdf,.epub,.mobi";

      fileInput.addEventListener("change", function (e) {
        handleFileSelection(e.target.files);
      });

      fileInput.click();
    });
  }

  if (chooseFileBtn) {
    chooseFileBtn.addEventListener("click", function (e) {
      e.preventDefault();
      filePlaceholder.click();
    });
  }

  function handleFileSelection(files) {
    if (files.length === 0) return;

    const file = files[0];

    // Max 50MB limit
    if (file.size > 50 * 1024 * 1024) {
      showError("File too large", `${file.name} exceeds 50MB limit`);
      return;
    }

    // Check file type
    const allowedTypes = [
      "application/pdf",
      "application/epub+zip",
      "application/x-mobipocket-ebook",
    ];
    const allowedExtensions = [".pdf", ".epub", ".mobi"];
    const fileExt = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf("."));

    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(fileExt)
    ) {
      showError("Invalid file type", "Please upload a PDF, EPUB, or MOBI file");
      return;
    }

    // Store the file
    window.uploadedFile = {
      file: file,
      name: file.name,
      type: file.type,
    };

    // Display file info
    const fileInfo = document.getElementById("file-info");
    if (fileInfo) {
      fileInfo.innerHTML = `
        <i class="fa-solid fa-check-circle" style="color: #10b981; margin-right: 6px;"></i>
        <strong>${file.name}</strong> (${(file.size / 1024 / 1024).toFixed(2)} MB)
      `;
    }

    // Update placeholder
    filePlaceholder.innerHTML = `
      <i class="fa-solid fa-check-circle"></i>
      <p>${file.name}</p>
      <small>Click to replace file</small>
    `;
    filePlaceholder.style.background = "#f0fdf4";
    filePlaceholder.style.border = "2px dashed #10b981";

    showSuccess("File ready", `${file.name} is ready to upload`);
  }
}

function initFormValidation() {
  const form = document.querySelector(".panel-form");

  if (!form) return;

  // Real-time validation
  const requiredFields = form.querySelectorAll("[required]");
  requiredFields.forEach((field) => {
    field.addEventListener("blur", function () {
      validateField(this);
    });

    field.addEventListener("input", function () {
      clearFieldError(this);
    });
  });

  // Form submission
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (validateForm()) {
      submitBookListing();
    }
  });

  // Auto-populate sub-genre based on genre
  const genreSelect = document.getElementById("genre");
  const subGenreSelect = document.getElementById("sub-genre");

  if (genreSelect && subGenreSelect) {
    genreSelect.addEventListener("change", function () {
      populateSubGenres(this.value, subGenreSelect);
    });
  }
}

function validateField(field) {
  const value = field.value.trim();
  const fieldName = field.name;
  let isValid = true;
  let errorMessage = "";

  switch (fieldName) {
    case "title":
      if (!value) {
        isValid = false;
        errorMessage = "Book title is required";
      } else if (value.length < 2) {
        isValid = false;
        errorMessage = "Book title must be at least 2 characters";
      }
      break;

    case "author":
      if (!value) {
        isValid = false;
        errorMessage = "Author name is required";
      } else if (value.length < 2) {
        isValid = false;
        errorMessage = "Author name must be at least 2 characters";
      }
      break;

    case "genre":
    case "sub-genre":
    case "condition":
      if (!value) {
        isValid = false;
        errorMessage = `Please select a ${fieldName.replace("-", " ")}`;
      }
      break;

    case "price":
      const price = parseFloat(value);
      if (!value) {
        isValid = false;
        errorMessage = "Price is required";
      } else if (isNaN(price) || price <= 0) {
        isValid = false;
        errorMessage = "Please enter a valid price greater than 0";
      } else if (price > 50000) {
        isValid = false;
        errorMessage = "Price seems too high. Please verify.";
      }
      break;

    case "email":
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) {
        isValid = false;
        errorMessage = "Email is required";
      } else if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = "Please enter a valid email address";
      }
      break;
  }

  if (!isValid) {
    showFieldError(field, errorMessage);
  } else {
    clearFieldError(field);
  }

  return isValid;
}

function showFieldError(field, message) {
  clearFieldError(field);

  field.style.borderColor = "#ef4444";

  const errorDiv = document.createElement("div");
  errorDiv.className = "field-error";
  errorDiv.textContent = message;
  errorDiv.style.cssText = `
        color: #ef4444;
        font-size: 14px;
        margin-top: 4px;
        margin-bottom: 8px;
    `;

  field.parentNode.insertBefore(errorDiv, field.nextSibling);
}

function clearFieldError(field) {
  field.style.borderColor = "";
  const errorDiv = field.parentNode.querySelector(".field-error");
  if (errorDiv) {
    errorDiv.remove();
  }
}

function validateForm() {
  const form = document.querySelector(".panel-form");
  const requiredFields = form.querySelectorAll("[required]");
  let isFormValid = true;

  requiredFields.forEach((field) => {
    if (!validateField(field)) {
      isFormValid = false;
    }
  });

  // Additional validations
  const price = document.getElementById("price");
  const condition = document.getElementById("condition");

  if (price && condition) {
    const priceValue = parseFloat(price.value);
    const conditionValue = condition.value;

    // Price validation based on condition
    if (conditionValue === "new" && priceValue < 100) {
      showFieldError(price, "New books should be priced higher");
      isFormValid = false;
    }

    if (conditionValue === "fair" && priceValue > 1000) {
      showFieldError(price, "Fair condition books should be priced lower");
      isFormValid = false;
    }
  }

  return isFormValid;
}

function populateSubGenres(genre, subGenreSelect) {
  // Clear existing options (except the first one)
  while (subGenreSelect.children.length > 1) {
    subGenreSelect.removeChild(subGenreSelect.lastChild);
  }

  const subGenres = {
    romance: ["Contemporary Romance", "Historical Romance"],
    adventure: ["Fantasy Adventure", "Travel Adventure"],
    business: ["Entrepreneurship", "Marketing", "Leadership"],
    education: [
      "Textbooks",
      "Study Guides",
      "Learning Materials",
      "Reference Books",
    ],
    "financial-literacy": ["Investing", "Budgeting", "Money Management"],
    memoir: ["Autobiography", "Biography", "Biography & History"],
    "self-help": ["Personal Development", "Productivity", "Wellness"],
    spiritual: ["Mindfulness", "Meditation", "Faith", "Spirituality"],
    women: ["Feminism", "Women's Health", "Women Empowerment"],
    mystery: ["Mystery", "Thriller"],
    "science-fiction": ["Science Fiction", "Fantasy", "Horror"],
    history: ["History", "Biography & History"],
  };

  if (subGenres[genre]) {
    subGenres[genre].forEach((subGenre) => {
      const option = document.createElement("option");
      option.value = subGenre
        .toLowerCase()
        .replace(/ & /g, "-")
        .replace(/\s+/g, "-");
      option.textContent = subGenre;
      subGenreSelect.appendChild(option);
    });
  }
}

function initPriceCalculator() {
  const conditionSelect = document.getElementById("condition");
  const priceInput = document.getElementById("price");

  if (conditionSelect && priceInput) {
    // Show price suggestions when condition changes
    conditionSelect.addEventListener("change", function () {
      showPriceSuggestion(this.value);
    });
  }
}

function showPriceSuggestion(condition) {
  const suggestions = {
    new: "70-100% of original price",
    "like-new": "60-80% of original price",
    "very-good": "50-70% of original price",
    good: "30-50% of original price",
    fair: "20-30% of original price",
  };

  const priceInput = document.getElementById("price");
  if (priceInput && suggestions[condition]) {
    // You could show a tooltip or helper text here
    console.log(`Price suggestion for ${condition}: ${suggestions[condition]}`);
  }
}

function initConditionSelector() {
  const conditionSelect = document.getElementById("condition");

  if (conditionSelect) {
    conditionSelect.addEventListener("change", function () {
      // Update price input placeholder based on condition
      const priceInput = document.getElementById("price");
      if (priceInput) {
        const placeholders = {
          new: "800",
          "like-new": "600",
          "very-good": "400",
          good: "250",
          fair: "150",
        };

        if (placeholders[this.value]) {
          priceInput.placeholder = placeholders[this.value];
        }
      }
    });
  }
}

// Upload book cover to S3
async function uploadBookCoverToS3(file) {
  try {
    const uploadFormData = new FormData();
    uploadFormData.append("image", file);

    const token =
      sessionStorage.getItem("accessToken") ||
      localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("You must be logged in to upload");
    }

    const response = await fetch(
      "http://localhost:5000/api/upload/book-cover",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to upload book cover");
    }

    const result = await response.json();
    if (result.success && result.data) {
      return result.data.url; // Return the S3 URL
    } else {
      throw new Error("Upload returned invalid response");
    }
  } catch (error) {
    console.error("Book cover upload error:", error);
    throw error;
  }
}

// Upload document file to S3
async function uploadDocumentToS3(file) {
  try {
    const uploadFormData = new FormData();
    uploadFormData.append("bookFile", file);

    const token =
      sessionStorage.getItem("accessToken") ||
      localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("You must be logged in to upload");
    }

    const response = await fetch("http://localhost:5000/api/upload/book-file", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: uploadFormData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to upload document");
    }

    const result = await response.json();
    if (result.success && result.data) {
      return result.data.url; // Return the S3 URL
    } else {
      throw new Error("Upload returned invalid response");
    }
  } catch (error) {
    console.error("Document upload error:", error);
    throw error;
  }
}

async function submitBookListing() {
  // Collect form data
  const form = document.querySelector(".panel-form");
  const formData = new FormData(form);

  // Show loading state
  const submitBtn = document.querySelector(".btn-submit");
  const originalText = submitBtn.textContent;

  submitBtn.textContent = "Listing Book...";
  submitBtn.disabled = true;

  try {
    // Check if user is logged in
    const userData = localStorage.getItem("rereadUser");
    if (!userData) {
      showWarning(
        "Not signed in",
        "Please sign in to list a book. Redirecting to sign in page...",
      );
      setTimeout(() => {
        window.location.href = "../pages/signin.html";
      }, 2000);
      return;
    }

    const user = JSON.parse(userData);

    // Map condition values to match database enum
    const conditionMap = {
      new: "New",
      "like-new": "Like New",
      "very-good": "Very Good",
      good: "Good",
      fair: "Fair",
    };

    const conditionValue = formData.get("condition");
    const mappedCondition = conditionMap[conditionValue] || "Good";

    // Upload all book images and document file to S3
    let bookImages = [];
    let documentUrl = null;

    // Upload all images in parallel
    if (window.uploadedImages && window.uploadedImages.length > 0) {
      submitBtn.textContent = `Uploading ${window.uploadedImages.length} image(s)...`;

      const uploadPromises = window.uploadedImages.map((imageData) =>
        uploadBookCoverToS3(imageData.file),
      );

      bookImages = await Promise.all(uploadPromises);
      submitBtn.textContent = "Listing Book...";
    }

    // Upload document file to S3
    if (window.uploadedFile) {
      submitBtn.textContent = "Uploading document file...";
      documentUrl = await uploadDocumentToS3(window.uploadedFile.file);
      submitBtn.textContent = "Listing Book...";
    }

    // Prepare book data object (for seller endpoint)
    const bookData = {
      title: formData.get("title"),
      author: formData.get("author"),
      price: parseFloat(formData.get("price")),
      condition: mappedCondition, // seller endpoint expects "condition"
      genre: formData.get("genre"),
      description: formData.get("description") || "",
      image: bookImages.length > 0 ? { url: bookImages[0] } : null, // Primary cover image
      images: bookImages.map((url) => ({ url })), // All book cover images
      documentUrl: documentUrl, // Ebook/document file for buyer download
    };

    // Optional fields
    const isbn = formData.get("isbn");
    if (isbn) {
      bookData.isbn = isbn;
    }

    console.log("Submitting book data:", bookData);

    // Get auth token from sessionStorage or localStorage
    const token =
      sessionStorage.getItem("accessToken") ||
      localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("You must be logged in to list a book");
    }

    // Make API call to create book using seller endpoint (authenticated)
    const response = await fetch("http://localhost:5000/api/seller/books", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bookData),
    });

    // Check content type before parsing
    const contentType = response.headers.get("content-type");
    let result;

    if (contentType && contentType.includes("application/json")) {
      result = await response.json();
    } else {
      // Server returned non-JSON (likely error HTML page)
      const responseText = await response.text();
      console.error("Server returned non-JSON response:", responseText);
      throw new Error(
        `Server error: ${response.status} ${response.statusText}`,
      );
    }

    if (response.ok && result.success) {
      // Reset form
      form.reset();

      // Reset image upload area
      window.uploadedImages = [];
      const photoPlaceholder = document.querySelector(".photo-placeholder");
      if (photoPlaceholder) {
        photoPlaceholder.innerHTML = `
                    <i class="fa-solid fa-cloud-arrow-up"></i>
                    <p>Upload photos of your book</p>
                    <small style="color: #9ca3af; margin-top: 8px">Add up to 5 photos showing the cover, spine, and any damage</small>
                `;
        photoPlaceholder.style.background = "";
        photoPlaceholder.style.border = "";
      }

      // Reset document file upload area
      window.uploadedFile = null;
      const filePlaceholder = document.querySelector(".file-placeholder");
      const fileInfo = document.getElementById("file-info");
      if (filePlaceholder) {
        filePlaceholder.innerHTML = `
                    <i class="fa-solid fa-file-arrow-up"></i>
                    <p>Upload your ebook or document</p>
                    <small style="color: #9ca3af; margin-top: 8px">Buyers can download this file after purchase</small>
                `;
        filePlaceholder.style.background = "";
        filePlaceholder.style.border = "";
      }
      if (fileInfo) {
        fileInfo.innerHTML = "";
      }

      // Show success message with notification
      showSuccess(
        "Book listed successfully!",
        "Your book is now available in the shop. Redirecting...",
      );

      // Redirect to shop page to see the new book
      setTimeout(() => {
        window.location.href = "../pages/shop.html";
      }, 2000);
    } else {
      throw new Error(result.message || "Failed to create book listing");
    }
  } catch (error) {
    console.error("Error submitting book:", error);
    showError("Failed to list book", error.message);
  } finally {
    // Reset button
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}
