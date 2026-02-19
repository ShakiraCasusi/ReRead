// Profile page script - CRUD operations with API integration

console.log("profile.js loaded");

const API_BASE_URL = "http://localhost:5000/api";
let currentUser = null;
let isEditMode = false;
let uploadedProfilePicture = null;

// Initialize profile page
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Profile page initializing...");

  // Check if user is logged in
  const accessToken = sessionStorage.getItem("accessToken");
  if (!accessToken) {
    showErrorState("Please sign in to view your profile.");
    return;
  }

  // Load profile data
  await loadProfile();

  // Setup profile picture upload
  setupProfilePictureUpload();

  // Update cart badge
  if (typeof updateCartBadge === "function") {
    updateCartBadge();
  }
});

// Setup profile picture upload
function setupProfilePictureUpload() {
  const uploadPhotoBtn = document
    .querySelector(".profile-avatar-placeholder")
    .parentElement.querySelector("button");

  if (uploadPhotoBtn) {
    uploadPhotoBtn.addEventListener("click", function (e) {
      e.preventDefault();
      // Create hidden file input
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.addEventListener("change", async function (e) {
        const file = e.target.files[0];
        if (file) {
          await handleProfilePictureUpload(file);
        }
      });
      fileInput.click();
    });
  }
}

// Handle profile picture upload
async function handleProfilePictureUpload(file) {
  try {
    // Validate file
    if (!file.type.startsWith("image/")) {
      showNotification("Please select a valid image file", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification("Image must be less than 5MB", "error");
      return;
    }

    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      showNotification(
        "You must be logged in to upload a profile picture",
        "error",
      );
      return;
    }

    // Show loading state
    showNotification("Uploading profile picture...", "info");

    // Upload to S3
    const formData = new FormData();
    formData.append("profilePicture", file);

    const response = await fetch(`${API_BASE_URL}/upload/profile-picture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to upload profile picture");
    }

    const result = await response.json();
    if (result.success && result.data) {
      uploadedProfilePicture = result.data.url;

      // Update user profile with new picture URL
      await updateProfilePicture(uploadedProfilePicture);

      showNotification("Profile picture uploaded successfully!", "success");
    } else {
      throw new Error("Upload returned invalid response");
    }
  } catch (error) {
    console.error("Profile picture upload error:", error);
    showNotification(
      error.message || "Failed to upload profile picture",
      "error",
    );
  }
}

// Update user profile with picture URL
async function updateProfilePicture(pictureUrl) {
  try {
    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      throw new Error("Not authenticated");
    }

    // Update profile with picture URL
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        profilePicture: pictureUrl,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save profile picture");
    }

    const result = await response.json();
    if (result.success && result.data) {
      currentUser = result.data;
      displayProfilePicture(pictureUrl);
    }
  } catch (error) {
    console.error("Error updating profile picture:", error);
    showNotification(
      error.message || "Failed to save profile picture",
      "error",
    );
  }
}

// Display profile picture
function displayProfilePicture(pictureUrl) {
  const avatarContainer = document.querySelector(".profile-avatar-placeholder");
  if (avatarContainer) {
    // Handle both string URLs and object format
    let imageUrl = pictureUrl;
    if (typeof pictureUrl === "object" && pictureUrl.url) {
      imageUrl = pictureUrl.url;
    }

    if (imageUrl) {
      // Clear existing content
      avatarContainer.innerHTML = "";

      // Create and display image
      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = "Profile Picture";
      img.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
      `;

      avatarContainer.appendChild(img);
    }
  }
}

// Load user profile from API
async function loadProfile() {
  try {
    showLoadingState();

    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No access token found");
    }

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        sessionStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        sessionStorage.removeItem("user");
        window.location.href = "signin.html";
        return;
      }
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to load profile");
    }

    const result = await response.json();
    if (result.success && result.data) {
      currentUser = result.data;
      displayProfile();
      hideErrorState();
    } else {
      throw new Error("Invalid response from server");
    }
  } catch (error) {
    console.error("Error loading profile:", error);
    showErrorState(
      error.message || "Failed to load profile. Please try again.",
    );
  }
}

// Display profile data in the UI
function displayProfile() {
  if (!currentUser) {
    console.error("No user data to display");
    return;
  }

  try {
    // Display profile picture if it exists
    if (currentUser.profilePicture) {
      displayProfilePicture(currentUser.profilePicture);
    }

    // Profile Header
    const displayName = document.getElementById("displayName");
    const displayUsername = document.getElementById("displayUsername");
    const memberSinceText = document.getElementById("memberSinceText");

    if (displayName) {
      const fullName =
        `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() ||
        currentUser.username ||
        "User";
      displayName.textContent = fullName;
    }

    if (displayUsername) {
      displayUsername.textContent = `@${currentUser.username || "username"}`;
    }

    if (memberSinceText && currentUser.createdAt) {
      const joinDate = new Date(currentUser.createdAt);
      memberSinceText.textContent = `Member since ${joinDate.toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      )}`;
    }

    // View Mode - Account Information
    const viewFirstName = document.getElementById("viewFirstName");
    const viewLastName = document.getElementById("viewLastName");
    const viewUsername = document.getElementById("viewUsername");
    const viewEmail = document.getElementById("viewEmail");

    if (viewFirstName) {
      viewFirstName.textContent = currentUser.firstName || "-";
    }
    if (viewLastName) {
      viewLastName.textContent = currentUser.lastName || "-";
    }
    if (viewUsername) {
      viewUsername.textContent = currentUser.username || "-";
    }
    if (viewEmail) {
      viewEmail.textContent = currentUser.email || "-";
    }

    // Edit Form - Pre-populate fields
    const editFirstName = document.getElementById("editFirstName");
    const editLastName = document.getElementById("editLastName");
    const editUsername = document.getElementById("editUsername");
    const editEmail = document.getElementById("editEmail");

    if (editFirstName) {
      editFirstName.value = currentUser.firstName || "";
    }
    if (editLastName) {
      editLastName.value = currentUser.lastName || "";
    }
    if (editUsername) {
      editUsername.value = currentUser.username || "";
    }
    if (editEmail) {
      editEmail.value = currentUser.email || "";
    }

    // Seller Badge
    const sellerBadge = document.getElementById("sellerBadge");
    if (sellerBadge) {
      if (currentUser.isSeller) {
        sellerBadge.style.display = "block";
      } else {
        sellerBadge.style.display = "none";
      }
    }

    // Update navbar with username
    updateNavbarWithUsername(currentUser.username);

    console.log("Profile displayed successfully");
  } catch (error) {
    console.error("Error displaying profile:", error);
    showErrorState("Error displaying profile data");
  }
}

// Toggle between view and edit modes
function toggleEditMode() {
  const viewMode = document.getElementById("viewMode");
  const editForm = document.getElementById("editForm");
  const editToggleBtn = document.getElementById("editToggleBtn");

  if (!viewMode || !editForm) {
    console.error("Edit mode elements not found");
    return;
  }

  isEditMode = !isEditMode;

  if (isEditMode) {
    // Switch to edit mode
    viewMode.style.display = "none";
    editForm.style.display = "block";
    if (editToggleBtn) {
      editToggleBtn.innerHTML = '<i class="fas fa-times me-2"></i>Cancel';
      editToggleBtn.onclick = toggleEditMode;
    }
  } else {
    // Switch back to view mode
    viewMode.style.display = "block";
    editForm.style.display = "none";
    if (editToggleBtn) {
      editToggleBtn.innerHTML = '<i class="fas fa-edit me-2"></i>Edit';
      editToggleBtn.onclick = toggleEditMode;
    }
  }
}

// Handle profile update (UPDATE operation)
async function handleProfileUpdate(e) {
  e.preventDefault();

  try {
    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      showNotification("Please sign in to update your profile", "error");
      window.location.href = "signin.html";
      return;
    }

    // Get form values
    const firstName = document.getElementById("editFirstName").value.trim();
    const lastName = document.getElementById("editLastName").value.trim();
    const username = document.getElementById("editUsername").value.trim();
    // Email is read-only and not sent in update
    const currentEmail = currentUser.email;

    // Basic validation
    if (!firstName || !lastName || !username) {
      showNotification("All fields are required", "error");
      return;
    }

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';
    }

    // Send update request (email excluded)
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName,
        lastName,
        username,
        // Email intentionally excluded
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update profile");
    }

    if (result.success && result.data) {
      // Update current user data
      currentUser = result.data;

      // Update sessionStorage user data if it exists
      const sessionUser = sessionStorage.getItem("user");
      if (sessionUser) {
        const userData = JSON.parse(sessionUser);
        userData.firstName = result.data.firstName;
        userData.lastName = result.data.lastName;
        userData.username = result.data.username;
        // Keep email unchanged
        sessionStorage.setItem("user", JSON.stringify(userData));
      }

      // Update navbar with new username
      updateNavbarWithUsername(result.data.username);

      // Refresh display
      displayProfile();
      toggleEditMode();
      showNotification("Profile updated successfully!", "success");
    } else {
      throw new Error(result.message || "Update failed");
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    showNotification(
      error.message || "Error updating profile. Please try again.",
      "error",
    );
  } finally {
    // Restore button state
    const submitBtn = document.querySelector('#editForm button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>Save Changes';
    }
  }
}

// Update navbar to display username instead of email
function updateNavbarWithUsername(username) {
  try {
    if (!username) {
      console.warn("No username provided to update navbar");
      return;
    }

    // Desktop navigation - Find and update Sign In link
    const desktopNav = document.querySelector("nav.d-none.d-lg-flex");
    if (desktopNav) {
      const signInLink = desktopNav.querySelector('a[href="signin.html"]');
      if (signInLink) {
        signInLink.innerHTML = `<i class="fas fa-user me-1"></i>${username}`;
        signInLink.href = "profile.html";
        signInLink.classList.add("active");
      }
    }

    // Mobile navigation - Find and update Sign In link
    const mobileMenu = document.getElementById("mobileMenu");
    if (mobileMenu) {
      const signInLink = mobileMenu.querySelector('a[href="signin.html"]');
      if (signInLink) {
        signInLink.innerHTML = `<i class="fas fa-user me-2"></i>${username}`;
        signInLink.href = "profile.html";
        signInLink.classList.add("active");
      }
    }

    console.log("Navbar updated with username:", username);
  } catch (error) {
    console.error("Error updating navbar:", error);
  }
}

// Navigate to orders page
function goToOrders() {
  window.location.href = "orders.html";
}

// Handle account deletion (DELETE operation)
function handleDeleteAccount() {
  // Show the delete account modal
  const deleteModal = new bootstrap.Modal(
    document.getElementById("deleteAccountModal"),
  );
  deleteModal.show();

  // Reset the input field when modal is shown
  document.getElementById("deleteConfirmText").value = "";
  document.getElementById("confirmDeleteBtn").disabled = true;

  // Add event listener to input field for enabling/disabling delete button
  const deleteInput = document.getElementById("deleteConfirmText");
  deleteInput.addEventListener("input", function () {
    document.getElementById("confirmDeleteBtn").disabled =
      this.value !== "DELETE";
  });

  // Handle the confirm delete button click
  document.getElementById("confirmDeleteBtn").onclick = async function () {
    await performAccountDeletion();
    deleteModal.hide();
  };
}

// Perform the actual account deletion
async function performAccountDeletion() {
  try {
    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      showNotification("Please sign in to delete your account", "error");
      window.location.href = "signin.html";
      return;
    }

    // Show loading state
    showNotification("Deleting account...", "info");

    // Send DELETE request
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to delete account");
    }

    if (result.success) {
      // Clear all user data from storage
      sessionStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      sessionStorage.removeItem("user");
      localStorage.removeItem("rereadUser");
      localStorage.removeItem("rereadUserRemembered");
      localStorage.removeItem("rereadCart");

      // Show success message
      showNotification(
        "Account deleted successfully. Redirecting...",
        "success",
      );

      // Redirect to home page after delay
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 2000);
    } else {
      throw new Error(result.message || "Delete failed");
    }
  } catch (error) {
    console.error("Error deleting account:", error);
    showNotification(
      error.message || "Error deleting account. Please try again.",
      "error",
    );
  }
}

// Show loading state
function showLoadingState() {
  const errorState = document.getElementById("errorState");
  if (errorState) {
    errorState.style.display = "none";
  }
  // You can add a loading spinner here if needed
}

// Show error state
function showErrorState(message) {
  const errorState = document.getElementById("errorState");
  const errorMessage = document.getElementById("errorMessage");

  if (errorState) {
    errorState.style.display = "block";
    if (errorMessage) {
      errorMessage.textContent =
        message || "An error occurred while loading your profile.";
    }
  }
}

// Hide error state
function hideErrorState() {
  const errorState = document.getElementById("errorState");
  if (errorState) {
    errorState.style.display = "none";
  }
}

// Show notification
function showNotification(message, type = "success") {
  const colors = {
    success: "#10b981",
    error: "#ef4444",
    info: "#3b82f6",
    warning: "#f59e0b",
  };

  const notification = document.createElement("div");
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.success};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 3000);
}

// Add CSS animations if not already present
if (!document.querySelector("#profile-notification-styles")) {
  const style = document.createElement("style");
  style.id = "profile-notification-styles";
  style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
  document.head.appendChild(style);
}
