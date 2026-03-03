const express = require("express");
const router = express.Router();
const Cart = require("../models/Phase3Models").Cart;
const Book = require("../models/Book");
const tokenManager = require("../utils/tokenManager");
const { cartValidators } = require("../middleware/validators");

// Middleware to authenticate requests
const authenticateToken = tokenManager.authenticateToken;

// Get cart for user
router.get("/:userId", authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId }).populate(
      "items.book",
    );
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add item to cart
router.post(
  "/:userId/add",
  authenticateToken,
  cartValidators.addItem,
  async (req, res) => {
    try {
      const { bookId, quantity } = req.body;
      const book = await Book.findById(bookId);

      if (!book) {
        return res
          .status(404)
          .json({ success: false, message: "Book not found" });
      }

      let cart = await Cart.findOne({ user: req.params.userId });

      if (!cart) {
        cart = await Cart.create({ user: req.params.userId, items: [] });
      }

      const existingItem = cart.items.find(
        (item) => item.book.toString() === bookId,
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ book: bookId, quantity, price: book.price });
      }

      cart.totalPrice = cart.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      await cart.save();

      res
        .status(200)
        .json({ success: true, message: "Item added to cart", data: cart });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
);

// Remove item from cart
router.post("/:userId/remove", authenticateToken, async (req, res) => {
  try {
    const { bookId } = req.body;
    const cart = await Cart.findOne({ user: req.params.userId });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    cart.items = cart.items.filter((item) => item.book.toString() !== bookId);
    cart.totalPrice = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    await cart.save();

    res
      .status(200)
      .json({ success: true, message: "Item removed from cart", data: cart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
