document.addEventListener("DOMContentLoaded", function () {
    updateAuthUI();
    setupLogoutListener();
});

function updateAuthUI() {
    const user = localStorage.getItem("rereadUser");

    // Find signin/signup buttons with multiple selector patterns
    const signinBtn = document.querySelector('[data-signin-btn]') ||
        document.querySelector('a[href*="signin"], a[href*="sign-in"]') ||
        document.querySelector('button:has-text("Sign In")');

    const signupBtn = document.querySelector('[data-signup-btn]') ||
        document.querySelector('a[href*="signup"], a[href*="sign-up"]');

    const userMenu = document.querySelector('[data-user-menu]') ||
        document.querySelector('.user-profile, .user-menu, .profile-menu');

    const logoutBtn = document.querySelector('[data-logout-btn]') ||
        document.querySelector('button[data-logout], a[data-logout]');

    if (user) {
        // User is logged in - hide auth buttons, show user menu
        try {
            const userData = JSON.parse(user);

            // Hide signin button
            if (signinBtn) {
                signinBtn.style.display = "none";
                signinBtn.classList.add("d-none", "hidden");
            }

            // Hide signup button
            if (signupBtn) {
                signupBtn.style.display = "none";
                signupBtn.classList.add("d-none", "hidden");
            }

            // Show user menu
            if (userMenu) {
                userMenu.style.display = "block";
                userMenu.classList.remove("d-none", "hidden");
                userMenu.classList.add("d-block", "visible");

                // Update user name/email in menu if available
                const userNameEl = userMenu.querySelector('[data-user-name], .user-name, .username');
                if (userNameEl) {
                    userNameEl.textContent = userData.username || userData.email || "User";
                }

                const userEmailEl = userMenu.querySelector('[data-user-email], .user-email');
                if (userEmailEl) {
                    userEmailEl.textContent = userData.email || "";
                }
            }

            console.log("Auth UI updated - user logged in:", userData.email);
        } catch (error) {
            console.error("Error parsing user data:", error);
            clearAuth();
        }
    } else {
        // User is not logged in - show auth buttons, hide user menu
        if (signinBtn) {
            signinBtn.style.display = "inline-block";
            signinBtn.classList.remove("d-none", "hidden");
            signinBtn.classList.add("d-inline-block", "visible");
        }

        if (signupBtn) {
            signupBtn.style.display = "inline-block";
            signupBtn.classList.remove("d-none", "hidden");
            signupBtn.classList.add("d-inline-block", "visible");
        }

        if (userMenu) {
            userMenu.style.display = "none";
            userMenu.classList.add("d-none", "hidden");
            userMenu.classList.remove("d-block", "visible");
        }

        console.log("Auth UI updated - user not logged in");
    }
}

function setupLogoutListener() {
    const logoutBtn = document.querySelector('[data-logout-btn]') ||
        document.querySelector('button[data-logout], a[data-logout], .logout-btn');

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (e) {
            e.preventDefault();
            logout();
        });
    }
}

function logout() {
    console.log("Logging out user...");
    localStorage.removeItem("rereadUser");
    localStorage.removeItem("rereadUserRemembered");

    showSuccessMessage("You have been logged out successfully.");

    setTimeout(() => {
        // Redirect to signin page (adjust path as needed)
        window.location.href = "./pages/signin.html";
    }, 1500);
}

function clearAuth() {
    localStorage.removeItem("rereadUser");
    localStorage.removeItem("rereadUserRemembered");
    updateAuthUI();
}

function showSuccessMessage(message) {
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
    border-radius: 4px;
    padding: 15px 20px;
    z-index: 9999;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    max-width: 500px;
    word-wrap: break-word;
  `;
    alertDiv.innerHTML = `<strong>Success!</strong> ${message}`;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 2000);
}

// Listen for storage changes (login from another tab/window)
window.addEventListener("storage", function (e) {
    if (e.key === "rereadUser") {
        console.log("Storage changed, updating UI...");
        updateAuthUI();
    }
});

// Re-check auth status every 5 seconds (handles rapid page transitions)
setInterval(() => {
    updateAuthUI();
}, 5000);
