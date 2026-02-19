// Frontend Authentication Manager
// Manages user session, login/logout, and UI updates :)))

class AuthManager {
  constructor() {
    this.user = this.loadUser();
    this.initAuthUI();
  }

  // Load user from localStorage
  loadUser() {
    try {
      const userData = localStorage.getItem("rereadUser");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error loading user:", error);
      return null;
    }
  }

  // Save user to localStorage
  saveUser(userData) {
    localStorage.setItem("rereadUser", JSON.stringify(userData));
    this.user = userData;
    this.initAuthUI();
  }

  // Check if user is logged in
  isLoggedIn() {
    return this.user && this.user.id;
  }

  // Get current user
  getUser() {
    return this.user;
  }

  // Get user roles
  getUserRoles() {
    const roles = this.user?.role;
    return Array.isArray(roles) ? roles : roles ? [roles] : [];
  }

  // Check if user is a seller
  isSeller() {
    return this.user?.isSeller || this.getUserRoles().includes("seller");
  }

  // Close any open Bootstrap dropdowns, modals, or offcanvas
  closeBootstrapComponents() {
    // Close all dropdowns
    document.querySelectorAll(".dropdown-menu.show").forEach((menu) => {
      menu.classList.remove("show");
    });

    // Close offcanvas if open
    const offcanvas = document.querySelector(".offcanvas.show");
    if (offcanvas) {
      const instance = bootstrap.Offcanvas.getInstance(offcanvas);
      if (instance) instance.hide();
    }

    // Remove backdrop if present
    const backdrops = document.querySelectorAll(".modal-backdrop");
    backdrops.forEach((backdrop) => backdrop.remove());
  }

  // Logout user
  logout() {
    localStorage.removeItem("rereadUser");
    localStorage.removeItem("refreshToken");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("tokenExpiryTime");
    this.user = null;
    this.closeBootstrapComponents();
    this.initAuthUI();
    window.location.href = "../pages/signin.html";
  }

  // Initialize authentication UI (show/hide buttons based on login state)
  initAuthUI() {
    // Close any leftover Bootstrap components from previous page navigation
    this.closeBootstrapComponents();
    const signinButtons = document.querySelectorAll(
      'a[href="signin.html"], a[href="../pages/signin.html"]',
    );

    if (this.isLoggedIn()) {
      signinButtons.forEach((btn) => {
        btn.style.display = "none";
      });

      this.createUserMenu();
      this.createMobileUserMenu();
    } else {
      signinButtons.forEach((btn) => {
        btn.style.display = "inline-block";
      });

      this.removeUserMenu();
      this.removeMobileUserMenu();
    }

    this.updateHeaderVisibility();
    this.applyRoleVisibility();
  }

  // Toggle elements based on role
  applyRoleVisibility() {
    const isLoggedIn = this.isLoggedIn();
    const roles = this.getUserRoles();

    document.querySelectorAll("[data-role]").forEach((el) => {
      const allowed = el.getAttribute("data-role") || "";
      const allowedRoles = allowed
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);

      if (!isLoggedIn) {
        el.style.display = "none";
        return;
      }

      const canSee =
        allowedRoles.length === 0 ||
        allowedRoles.some((role) => roles.includes(role));
      el.style.display = canSee ? "" : "none";
    });
  }

  // Create user profile menu
  createUserMenu() {
    if (document.getElementById("userProfileMenu")) {
      return;
    }

    const nav = document.querySelector("nav.col-auto.d-none.d-lg-flex");
    if (!nav) return;

    const dropdown = document.createElement("div");
    dropdown.className = "dropdown";
    dropdown.id = "userProfileMenu";

    const sellerLinks = this.isSeller()
      ? `
        <li><a class="dropdown-item" href="../pages/sell.html"><i class="fas fa-tag me-2"></i>Sell Book</a></li>
        <li><a class="dropdown-item" href="../pages/manage-listings.html"><i class="fas fa-list me-2"></i>Manage Listings</a></li>
      `
      : `
        <li><a class="dropdown-item" href="../pages/sell.html"><i class="fas fa-store me-2"></i>Become a Seller</a></li>
      `;

    dropdown.innerHTML = `
      <button class="btn btn-link text-dark text-decoration-none dropdown-toggle" type="button" id="userMenuBtn" data-bs-toggle="dropdown">
        <i class="fas fa-user-circle me-1"></i>${this.user.username}
      </button>
      <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userMenuBtn">
        <li><a class="dropdown-item" href="../pages/profile.html"><i class="fas fa-user me-2"></i>Profile</a></li>
        <li><a class="dropdown-item" href="../pages/orders.html"><i class="fas fa-history me-2"></i>Orders</a></li>
        <li><a class="dropdown-item" href="../pages/shop.html#likes"><i class="fas fa-heart me-2"></i>My Likes</a></li>
        ${sellerLinks}
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item" id="logoutBtn"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
      </ul>
    `;

    const signinLink = nav.querySelector(
      'a[href="signin.html"], a[href="../pages/signin.html"]',
    );
    if (signinLink) {
      signinLink.parentElement.insertBefore(dropdown, signinLink);
    } else {
      nav.appendChild(dropdown);
    }

    // Add click handlers to close dropdown when navigating
    const dropdownItems = dropdown.querySelectorAll(".dropdown-item[href]");
    dropdownItems.forEach((item) => {
      item.addEventListener("click", () => {
        this.closeBootstrapComponents();
      });
    });

    document.getElementById("logoutBtn").addEventListener("click", (e) => {
      e.preventDefault();
      this.logout();
    });
  }

  // Remove user profile menu
  removeUserMenu() {
    const menu = document.getElementById("userProfileMenu");
    if (menu) {
      menu.remove();
    }
  }

  // Create mobile user profile menu
  createMobileUserMenu() {
    // Check if mobile menu already exists
    if (document.getElementById("mobileUserProfileMenu")) {
      return;
    }

    // Find the mobile menu offcanvas body
    const mobileMenuBody = document.querySelector(
      "#mobileMenu .offcanvas-body .list-group",
    );
    if (!mobileMenuBody) return;

    // Create mobile profile menu item
    const mobileMenuItem = document.createElement("div");
    mobileMenuItem.id = "mobileUserProfileMenu";
    mobileMenuItem.className = "list-group-item p-0";
    const sellerLinks = this.isSeller()
      ? `
        <li><a href="sell.html" class="list-group-item list-group-item-action border-0"><i class="fas fa-tag me-2"></i>Sell Book</a></li>
        <li><a href="manage-listings.html" class="list-group-item list-group-item-action border-0"><i class="fas fa-list me-2"></i>Manage Listings</a></li>
      `
      : `
        <li><a href="sell.html" class="list-group-item list-group-item-action border-0"><i class="fas fa-store me-2"></i>Become a Seller</a></li>
      `;
    mobileMenuItem.innerHTML = `
      <div class="accordion accordion-flush" id="profileAccordion">
        <div class="accordion-item border-0">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed fw-semibold" type="button" data-bs-toggle="collapse"
              data-bs-target="#profileCollapse" aria-expanded="false" aria-controls="profileCollapse">
              <i class="fas fa-user-circle me-2"></i>${this.user.username}
            </button>
          </h2>
          <div id="profileCollapse" class="accordion-collapse collapse" data-bs-parent="#profileAccordion">
            <div class="accordion-body p-0">
              <ul class="list-unstyled">
                <li><a href="profile.html" class="list-group-item list-group-item-action border-0"><i class="fas fa-user me-2"></i>Profile</a></li>
                <li><a href="orders.html" class="list-group-item list-group-item-action border-0"><i class="fas fa-history me-2"></i>Orders</a></li>
                <li><a href="shop.html#likes" class="list-group-item list-group-item-action border-0"><i class="fas fa-heart me-2"></i>My Likes</a></li>
                ${sellerLinks}
                <li><a href="#" id="mobileLogoutBtn" class="list-group-item list-group-item-action border-0 text-danger"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;

    // Find the sign in link in mobile menu
    const signInLink = mobileMenuBody.querySelector('a[href="signin.html"]');
    if (signInLink && signInLink.parentElement) {
      signInLink.parentElement.replaceWith(mobileMenuItem);
    } else {
      mobileMenuBody.appendChild(mobileMenuItem);
    }

    // Add logout handler
    const logoutBtn = document.getElementById("mobileLogoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.logout();
      });
    }

    // Add click handlers to close offcanvas when navigating
    const mobileMenuLinks = mobileMenuItem.querySelectorAll(
      "a[href]:not(#mobileLogoutBtn)",
    );
    mobileMenuLinks.forEach((link) => {
      link.addEventListener("click", () => {
        this.closeBootstrapComponents();
      });
    });
  }

  // Remove mobile user profile menu
  removeMobileUserMenu() {
    const menu = document.getElementById("mobileUserProfileMenu");
    if (menu) {
      menu.remove();
    }

    // Restore Sign In link if needed
    const mobileMenuBody = document.querySelector(
      "#mobileMenu .offcanvas-body .list-group",
    );
    if (
      mobileMenuBody &&
      !document.querySelector('#mobileMenu a[href="signin.html"]')
    ) {
      const signInItem = document.createElement("a");
      signInItem.href = "signin.html";
      signInItem.className = "list-group-item list-group-item-action border-0";
      signInItem.innerHTML = '<i class="fas fa-user me-2"></i>Sign In';
      mobileMenuBody.appendChild(signInItem);
    }
  }

  // Update header visibility based on authentication state
  updateHeaderVisibility() {
    const user = localStorage.getItem("rereadUser");

    // Hide Sign In link (Desktop)
    const desktopSignIn = document.querySelector(
      'nav a[href="pages/signin.html"]',
    );
    if (desktopSignIn) {
      desktopSignIn.style.display = user ? "none" : "block";
    }

    // Hide Sign In link (Mobile)
    const mobileSignIn = document.querySelector(
      '#mobileMenu a[href="pages/signin.html"]',
    );
    if (mobileSignIn) {
      mobileSignIn.style.display = user ? "none" : "block";
    }
  }
}

// Initialize AuthManager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.authManager = new AuthManager();
});

// Initialize navbar with user info on page load
function initializeNavbar() {
  const user = sessionStorage.getItem("user");

  if (user) {
    try {
      const userData = JSON.parse(user);
      if (userData.username) {
        updateNavbarUser(userData.username);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }
}

// Update navbar to show username
function updateNavbarUser(username) {
  try {
    // Desktop navigation
    const desktopNav = document.querySelector("nav.d-none.d-lg-flex");
    if (desktopNav) {
      const signInLink = desktopNav.querySelector('a[href="signin.html"]');
      if (signInLink) {
        signInLink.innerHTML = `<i class="fas fa-user me-1"></i>${username}`;
        signInLink.href = "profile.html";
        signInLink.classList.add("active");
      }
    }

    // Mobile navigation
    const mobileMenu = document.getElementById("mobileMenu");
    if (mobileMenu) {
      const signInLink = mobileMenu.querySelector('a[href="signin.html"]');
      if (signInLink) {
        signInLink.innerHTML = `<i class="fas fa-user me-2"></i>${username}`;
        signInLink.href = "profile.html";
        signInLink.classList.add("active");
      }
    }
  } catch (error) {
    console.error("Error updating navbar user:", error);
  }
}

// Initialize navbar when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  initializeNavbar();
});
