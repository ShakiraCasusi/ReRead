## 📄 Re;Read Website

Re;Read is an online platform for buying and selling second-hand books.  
It gives students and readers access to quality and affordable books.  
The site is built with HTML, CSS, JavaScript, and Bootstrap.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Recent Updates](#recent-updates)
- [Future Improvements](#future-improvements)
- [Acknowledgments](#acknowledgments)
- [Contributors](#contributors)

---

## 📄 Overview

Re;Read provides a simple way to browse, select, and purchase used books.  
It focuses on ease of use, mobile responsiveness, and a clean shopping flow.  
The project follows a static front-end structure that can be integrated with backend services later.

**Key Highlights:**

- Mobile-responsive UI
- Fast and lightweight
- PH region-based checkout logic
- Organized page structure
- Bootstrap UI components

---

## 📚 Features

- Homepage with featured books
- Shop page with listing of books
- Add to cart functionality
- Dynamic cart badge display
- Checkout with PH regions and provinces
- Responsive header and footer
- Unified navigation across pages

---

## 📁 Project Structure

```text
ReRead-Website/
│
├─ index.html                 → Homepage
├─ pages/
│  ├─ shop.html               → Shop listing
│  ├─ cart.html               → Cart page
│  ├─ signin.html             → Sign in
│  ├─ about.html              → About page
│  ├─ sell.html               → Sell books page
│
├─ styles/
│  ├─ main.css                → Global styling
│  └─ responsive.css          → Mobile styling
│
├─ scripts/
│  ├─ main.js                 → Header and navigation logic
│  ├─ shop.js                 → Shop logic
│  ├─ checkout.js             → Checkout and PH regions handling
│
├─ images/                    → Assets and icons
├─ ph-locations.json          → PH regions dataset
└─ README.md                  → Project documentation
```

---

## 🧰 Tech Stack

- HTML5
- CSS3
- JavaScript (Vanilla)
- Bootstrap 5
- JSON (for PH locations)

---

## 🖥️ Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/ShakiraCasusi/ReRead-Website.git

   ```

2. Open the folder:
   `cd ReRead-Website`
   `code .`

3. Run with Live Server in VS Code:
   Right-click `index.html` → Open with Live Server

---

## 📄 Usage

- Use the navigation bar to browse pages.
- Add books to the cart in the Shop page.
- Go to the Cart page to view or edit your selected books.
- Proceed to Checkout and select PH region and province.
- Complete the order flow.

---

## 🆕 Recent Updates (October 2025)

- Refactored header and navigation to be fully responsive
- Standardized mobile icon order (Cart, then Menu)
- Unified cart badge logic with hidden attribute
- Replaced custom buttons with Bootstrap buttons
- Cleaned redundant CSS and consolidated responsive header styling
- Synced navigation structure across all pages
- Improved checkout flow using PH region dataset

---

## 🔮 Future Improvements

- Add user authentication system
- Connect to a database for user accounts and orders
- Add seller and admin dashboards
- Improve accessibility and SEO
- Implement real checkout with backend

**How To Run Locally**

1. Open this folder in VS Code or your editor.
2. Use Live Server (recommended) or open index.html directly in a browser.
   - If using Live Server: right-click `index.html` → "Open with Live Server".
3. For full checkout testing, serve the project from an HTTP server (Live Server or Apache) so fetch()/relative paths work correctly.

Windows PowerShell quick start (from project root):

- Live Server: use the VS Code extension.
- To delete old batchfile docs (local cleanup), run the removal command provided below.

---

## 📄 VS Code Extensions Used

- **Live Server** (ritwickdey.LiveServer)
- **Prettier** - Code formatter (esbenp.prettier-vscode)
- **Auto Rename Tag** (formulahendry.auto-rename-tag)
- **IntelliSense for CSS class names in HTML** (Zignd.html-css-class-completion)
- **HTML CSS Support** (ecmel.vscode-html-css)
- **Better Comment** - Comment formatter for clean comments

---

## 📄 Acknowledgments

I would like to thank the following people and resources for their valuable guidance and support in my web development journey:

- **SDPT Solutions (YouTube)**
- **W3Schools**
- **StackOverflow** - some devs insights/quick tutorials in the comments
- **Felix Macaspac (TikTok Dev Content Creator, FrontEnd Dev)** — tips and best practices using HTML/CSS/JS.
- **Bryl Lim (TikTok Dev Content Creator, FullStack Dev)** — tips and best practices.
- **Rics (TikTok Dev Content Creator, Cloud Engineer)** — tips and best practices.
- **PaulSong213 (GitHub)** — ph-locations dataset
- **Lebron Piraman** — assistance with [book].png URL links finding in G00gle scripts/shop.js.

Their insights and educational content helped me gain a deeper understanding of web development concepts and best practices.

---

## 👥 Contributor

- **Developer:** Shakira Casusi
- **Focus:** FrontEnd Dev
- **Date:** October 2025
- **Project Status:** ---
