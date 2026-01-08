## 📄 Re;Read Website

Re;Read is an online platform for buying and selling second-hand books.  
It gives students and readers access to quality and affordable books.  
The site is built with HTML, CSS, JavaScript, Bootstrap, Node.js, and MongoDB.

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
The project is a full-stack application integrated with a Node.js backend and MongoDB database.

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
- **RESTful API** integration
- **CRUD operations** for cart and orders

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
│  ├─ profile.html            → User profile
│  ├─ orders.html             → Order history
│  ├─ sell.html               → Sell books page
│
├─ styles/
│  ├─ main.css                → Global styling
│  └─ responsive.css          → Mobile styling
│
├─ scripts/
│  ├─ main.js                 → Header and navigation logic
│  ├─ shop.js                 → Shop logic
│  ├─ auth.js                 → Authentication logic
│  ├─ profile.js              → Profile management
│  ├─ orders.js               → Order history logic
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
- Node.js (Backend)
- MongoDB (Database)
- RESTful API

---

## 🖥️ Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/ShakiraCasusi/ReRead-Website.git

   ```

2. Open the folder:
   `cd ReRead-Website`
   `npm install`

3. Start the application:
   `npm start`
   (Ensure backend server is running on port 5000)

---

## 📄 Usage

- Use the navigation bar to browse pages.
- Add books to the cart in the Shop page.
- Go to the Cart page to view or edit your selected books.
- Proceed to Checkout and select PH region and province.
- Complete the order flow.

---

## 🆕 Recent Updates (October 2025)

- **Integrated Node.js & MongoDB Backend**
- Added User Authentication (Login/Signup)
- Implemented Profile and Order History pages
- Connected Shop to live Database via API
- Refactored header and navigation to be fully responsive
- Standardized mobile icon order (Cart, then Menu)
- Implemented CRUD operations for Cart

---

## 🔮 Future Improvements

- Add seller and admin dashboards
- Improve accessibility and SEO
- Implement real checkout with backend
- Payment Gateway Integration
- Improved structure of codes (Still reviewing; also used Prettier VSCode Extension)

**How To Run Locally**

1. Open this folder in VS Code or your editor.
2. Ensure the backend is running.
3. Run `npm start` to launch the frontend server.

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
- **Lebron Piraman** — assistance with [book].png URL links finding in G00gle scripts/shop.js. [NOW IN API, Dec 2025]

Their insights and educational content helped me gain a deeper understanding of web development concepts and best practices.

---

## 👥 Contributor

- **Developer:** Shakira Casusi
- **Focus:** FrontEnd Dev
- **Date Started:** September 2025
- **Date Ended:** --- 2026
- **Project Status:** ---
