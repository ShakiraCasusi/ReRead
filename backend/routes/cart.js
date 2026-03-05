const express = require("express");
const router = express.Router();
const Cart = require("../models/Phase3Models").Cart;
const Book = require("../models/Book");
const tokenManager = require("../utils/tokenManager");
const { cartValidators } = require("../middleware/validators");
const bookController = require("../controllers/bookController");

const authenticateToken = tokenManager.authenticateToken;

router.get("/", authenticateToken, async (req, res) => {
  try {
    const userQuery = {
      $or: [{ userId: req.user.userId }, { user: req.user.userId }],
    };

    let cart = await Cart.findOne(userQuery).populate({
      path: "items.bookId",
      select: "title author price quality image images sellerName bookFile",
    });

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: { userId: req.user.userId, user: req.user.userId, items: [] },
      });
    }

    // Backfill fields for legacy docs
    if (!cart.userId) {
      cart.userId = req.user.userId;
    }
    if (!cart.user) {
      cart.user = req.user.userId;
    }
    await cart.save();

    const cartObj = cart.toObject();
    if (cartObj.items && cartObj.items.length > 0) {
      for (let i = 0; i < cartObj.items.length; i++) {
        if (cartObj.items[i].bookId) {
          cartObj.items[i].bookId = await bookController.normalizeBook(
            cartObj.items[i].bookId,
          );
        }
      }
    }

    console.log("Cart fetched:", {
      itemsCount: cartObj.items.length,
      items: cartObj.items.map((i) => ({
        bookId: i.bookId?._id,
        title: i.bookId?.title,
        price: i.priceAtTime,
        quantity: i.quantity,
        imageUrl: i.bookId?.image?.url,
      })),
    });

    res.status(200).json({ success: true, data: cartObj });
  } catch (error) {
    console.error("Error getting cart:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add item to cart
router.post(
  "/add",
  authenticateToken,
  cartValidators.addItem,
  async (req, res) => {
    try {
      const { bookId } = req.body;
      const quantity = Number(req.body.quantity) || 1;

      const book = await Book.findById(bookId).select(
        "title author price quality image images sellerName bookFile",
      );

      if (!book) {
        return res
          .status(404)
          .json({ success: false, message: "Book not found" });
      }

      const userQuery = {
        $or: [{ userId: req.user.userId }, { user: req.user.userId }],
      };
      let cart = await Cart.findOne(userQuery);

      if (!cart) {
        cart = await Cart.create({
          userId: req.user.userId,
          user: req.user.userId,
          items: [],
        });
      } else {
        if (!cart.userId) cart.userId = req.user.userId;
        if (!cart.user) cart.user = req.user.userId;
      }

      const existingItem = cart.items.find(
        (item) => item.bookId.toString() === bookId,
      );

      if (existingItem) {
        existingItem.quantity += quantity;
        console.log(
          `Updated existing cart item: ${book.title} quantity now ${existingItem.quantity}`,
        );
      } else {
        cart.items.push({
          bookId: bookId,
          quantity,
          priceAtTime: book.price,
        });
        console.log(
          `Added new item to cart: ${book.title} x${quantity} @ ₱${book.price}`,
        );
      }

      await cart.save();

      // Populate book data before sending response
      await cart.populate({
        path: "items.bookId",
        select: "title author price quality image images sellerName bookFile",
      });

      // Normalize book data to include signed S3 URLs
      const cartObj = cart.toObject();
      if (cartObj.items && cartObj.items.length > 0) {
        for (let i = 0; i < cartObj.items.length; i++) {
          if (cartObj.items[i].bookId) {
            cartObj.items[i].bookId = await bookController.normalizeBook(
              cartObj.items[i].bookId,
            );
          }
        }
      }

      console.log("Cart after add:", {
        itemsCount: cartObj.items.length,
        items: cartObj.items.map((i) => ({
          bookId: i.bookId?._id,
          title: i.bookId?.title,
          price: i.priceAtTime,
          quantity: i.quantity,
          imageUrl: i.bookId?.image?.url,
        })),
      });

      res.status(200).json({
        success: true,
        message: "Item added to cart",
        data: cartObj,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  },
);

router.put("/update", authenticateToken, async (req, res) => {
  try {
    const { bookId, quantity } = req.body;
    const normalizedQuantity = Number(quantity);
    if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Valid quantity is required" });
    }
    const cart = await Cart.findOne({
      $or: [{ userId: req.user.userId }, { user: req.user.userId }],
    });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const existingItem = cart.items.find(
      (item) => item.bookId.toString() === bookId,
    );

    if (!existingItem) {
      return res
        .status(404)
        .json({ success: false, message: "Item not in cart" });
    }

    existingItem.quantity = normalizedQuantity;
    console.log(
      `Updated cart item quantity: ${bookId} -> ${normalizedQuantity}`,
    );

    await cart.save();
    await cart.populate({
      path: "items.bookId",
      select: "title author price quality image images sellerName bookFile",
    });

    // Normalize book data to include signed S3 URLs
    const cartObj = cart.toObject();
    if (cartObj.items && cartObj.items.length > 0) {
      for (let i = 0; i < cartObj.items.length; i++) {
        if (cartObj.items[i].bookId) {
          cartObj.items[i].bookId = await bookController.normalizeBook(
            cartObj.items[i].bookId,
          );
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Cart updated",
      data: cartObj,
    });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Remove item from cart
router.delete("/remove", authenticateToken, async (req, res) => {
  try {
    const { bookId } = req.body;
    const cart = await Cart.findOne({
      $or: [{ userId: req.user.userId }, { user: req.user.userId }],
    });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const initialCount = cart.items.length;
    cart.items = cart.items.filter((item) => item.bookId.toString() !== bookId);

    console.log(
      `Removed item from cart: ${bookId} (${initialCount} -> ${cart.items.length} items)`,
    );

    await cart.save();
    await cart.populate({
      path: "items.bookId",
      select: "title author price quality image images sellerName bookFile",
    });

    // Normalize book data to include signed S3 URLs
    const cartObj = cart.toObject();
    if (cartObj.items && cartObj.items.length > 0) {
      for (let i = 0; i < cartObj.items.length; i++) {
        if (cartObj.items[i].bookId) {
          cartObj.items[i].bookId = await bookController.normalizeBook(
            cartObj.items[i].bookId,
          );
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Item removed from cart",
      data: cartObj,
    });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Clear cart
router.delete("/clear", authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({
      $or: [{ userId: req.user.userId }, { user: req.user.userId }],
    });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    console.log(`Cleared cart: ${cart.items.length} items removed`);
    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart cleared",
      data: cart,
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
