const express = require("express");
const router = express.Router();
const Order = require("../models/Phase3Models").Order;
const Cart = require("../models/Phase3Models").Cart;
const Book = require("../models/Book");
const User = require("../models/User");
const tokenManager = require("../utils/tokenManager");
const { requireRole } = require("../middleware/authorize");
const { orderValidators } = require("../middleware/validators");
const bookController = require("../controllers/bookController");
const { getSignedDownloadUrl } = require("../services/s3Service");

// Helper function to normalize book image field and generate signed URLs if needed
async function normalizeBook(book) {
  try {
    const bookObj = book.toObject ? book.toObject() : book;

    // If image is a string, convert to new object format
    if (typeof bookObj.image === "string") {
      bookObj.image = {
        url: bookObj.image,
        uploadedAt: book.createdAt || new Date(),
      };
    }

    // Generate signed URL for S3 images if needed
    if (
      bookObj.image &&
      bookObj.image.url &&
      typeof bookObj.image.url === "string"
    ) {
      const imageUrl = bookObj.image.url;

      // Check if this is an S3 URL that needs a signed version
      if (imageUrl.includes(".s3.") && !imageUrl.includes("?X-Amz-Signature")) {
        try {
          // Extract the S3 key from the URL
          // URL format: https://bucket.s3.region.amazonaws.com/key
          const urlParts = imageUrl.split(".amazonaws.com/");
          if (urlParts.length === 2) {
            const s3Key = decodeURIComponent(urlParts[1]);
            const signedUrlResult = await getSignedDownloadUrl(s3Key, 3600); // 1 hour
            if (signedUrlResult.success) {
              bookObj.image.url = signedUrlResult.url;
              bookObj.image.signedUntil = signedUrlResult.expiresAt;
            }
          }
        } catch (signedUrlError) {
          console.warn(
            "Could not generate signed URL for image:",
            signedUrlError.message,
          );
          // Fall back to original URL
        }
      }
    }

    // Handle multiple images array - generate signed URLs for each image
    if (bookObj.images && Array.isArray(bookObj.images)) {
      bookObj.images = await Promise.all(
        bookObj.images.map(async (imageObj) => {
          if (!imageObj) return imageObj;

          let imageUrl = null;
          if (typeof imageObj === "object" && imageObj.url) {
            imageUrl = imageObj.url;
          } else if (typeof imageObj === "string") {
            imageUrl = imageObj;
          }

          // Generate signed URL if S3 image
          if (
            imageUrl &&
            imageUrl.includes(".s3.") &&
            !imageUrl.includes("?X-Amz-Signature")
          ) {
            try {
              const urlParts = imageUrl.split(".amazonaws.com/");
              if (urlParts.length === 2) {
                const s3Key = decodeURIComponent(urlParts[1]);
                const signedUrlResult = await getSignedDownloadUrl(s3Key, 3600); // 1 hour
                if (signedUrlResult.success) {
                  if (typeof imageObj === "object") {
                    return {
                      ...imageObj,
                      url: signedUrlResult.url,
                      signedUntil: signedUrlResult.expiresAt,
                    };
                  } else {
                    return signedUrlResult.url;
                  }
                }
              }
            } catch (imageError) {
              console.warn(
                "Could not generate signed URL for image:",
                imageError.message,
              );
              // Fall back to original image object/string
            }
          }

          // If not S3 or already signed, return as is
          return imageObj;
        }),
      );
    }

    return bookObj;
  } catch (error) {
    console.error("Error normalizing book:", error);
    return book.toObject ? book.toObject() : book; // Return original if normalization fails
  }
}

// Middleware to authenticate requests
const authenticateToken = tokenManager.authenticateToken;

// Create order from cart (Phase 3 - New)
router.post(
  "/",
  authenticateToken,
  orderValidators.create,
  async (req, res) => {
    try {
      const {
        shippingAddress,
        totalAmount,
        paymentIntentId,
        items: providedItems,
      } = req.body;

      if (!totalAmount) {
        return res.status(400).json({
          success: false,
          message: "Total amount is required",
        });
      }

      let cartItems = [];

      // Option 1: Items provided directly in request (for direct checkout)
      if (
        providedItems &&
        Array.isArray(providedItems) &&
        providedItems.length > 0
      ) {
        // Validate and populate book data
        for (const item of providedItems) {
          const book = await Book.findById(item.bookId);
          if (!book) {
            return res.status(404).json({
              success: false,
              message: `Book not found: ${item.bookId}`,
            });
          }

          cartItems.push({
            bookId: book,
            quantity: item.quantity || 1,
            priceAtTime: item.price || book.price,
          });
        }
      } else {
        // Option 2: Get items from user's cart in database
        const cart = await Cart.findOne({
          $or: [{ userId: req.user.userId }, { user: req.user.userId }],
        }).populate("items.bookId");

        if (!cart || cart.items.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Cart is empty and no items provided",
          });
        }

        cartItems = cart.items;
      }

      if (cartItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No items to order",
        });
      }

      // Group items by seller
      const itemsBySeller = {};
      cartItems.forEach((item) => {
        const book = item.bookId;
        const sellerId = book.sellerId || book.seller || req.user.userId; // Fallback to user if no seller

        if (!itemsBySeller[sellerId]) {
          itemsBySeller[sellerId] = [];
        }

        itemsBySeller[sellerId].push({
          bookId: book._id,
          title: book.title,
          author: book.author,
          quantity: item.quantity,
          price: item.priceAtTime,
          subtotal: item.priceAtTime * item.quantity,
        });
      });

      // Create orders for each seller
      const orders = [];
      for (const [sellerId, items] of Object.entries(itemsBySeller)) {
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

        const order = await Order.create({
          buyerId: req.user.userId,
          sellerId,
          items,
          totalAmount: subtotal,
          shippingAddress: shippingAddress || {},
          status: "pending",
          paymentStatus: "pending",
          paymentIntentId: paymentIntentId || null,
        });

        orders.push(order);
      }

      // Clear cart if it exists and was used
      if (!providedItems) {
        const cart = await Cart.findOne({
          $or: [{ userId: req.user.userId }, { user: req.user.userId }],
        });
        if (cart) {
          cart.items = [];
          await cart.save();
        }
      }

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        notificationType: "ORDER_CREATED",
        data: { orders, orderCount: orders.length },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
);

// Get buyer's orders
router.get("/buyer", authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.user.userId })
      .populate("sellerId", "username email")
      .populate("items.bookId", "title author bookFile image images createdAt")
      .sort({ createdAt: -1 });

    // Normalize book images for each order
    const normalizedOrders = await Promise.all(
      orders.map(async (order) => {
        const orderObj = order.toObject();

        // Normalize each book in the order items
        orderObj.items = await Promise.all(
          orderObj.items.map(async (item) => {
            if (item.bookId) {
              item.bookId = await normalizeBook(item.bookId);
            }
            return item;
          }),
        );

        return orderObj;
      }),
    );

    res.status(200).json({
      success: true,
      data: normalizedOrders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get seller's orders
router.get(
  "/seller",
  authenticateToken,
  requireRole("seller"),
  async (req, res) => {
    try {
      // Check if user is a seller
      const user = await User.findById(req.user.userId);
      if (!user.isSeller) {
        return res.status(403).json({
          success: false,
          message: "Only sellers can view seller orders",
        });
      }

      const orders = await Order.find({ sellerId: req.user.userId })
        .populate("buyerId", "username email address")
        .populate(
          "items.bookId",
          "title author bookFile image images createdAt",
        )
        .sort({ createdAt: -1 });

      // Normalize book images for each order
      const normalizedOrders = await Promise.all(
        orders.map(async (order) => {
          const orderObj = order.toObject();

          // Normalize each book in the order items
          orderObj.items = await Promise.all(
            orderObj.items.map(async (item) => {
              if (item.bookId) {
                item.bookId = await normalizeBook(item.bookId);
              }
              return item;
            }),
          );

          return orderObj;
        }),
      );

      res.status(200).json({
        success: true,
        data: normalizedOrders,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
);

// Get order by ID
router.get("/:orderId", authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("buyerId", "username email")
      .populate("sellerId", "username email")
      .populate("items.bookId", "title author bookFile image images createdAt");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check authorization
    if (
      order.buyerId._id.toString() !== req.user.userId &&
      order.sellerId._id.toString() !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to order",
      });
    }

    // Normalize book images
    const orderObj = order.toObject();
    orderObj.items = await Promise.all(
      orderObj.items.map(async (item) => {
        if (item.bookId) {
          item.bookId = await normalizeBook(item.bookId);
        }
        return item;
      }),
    );

    res.status(200).json({
      success: true,
      data: orderObj,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Update order status (seller only)
router.put(
  "/:orderId/status",
  authenticateToken,
  requireRole("seller"),
  async (req, res) => {
    try {
      const { status, trackingNumber } = req.body;

      const validStatuses = [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Valid statuses: ${validStatuses.join(", ")}`,
        });
      }

      const order = await Order.findById(req.params.orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Check authorization - only seller can update
      if (order.sellerId.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: "Only seller can update order status",
        });
      }

      order.status = status;
      if (trackingNumber) {
        order.trackingNumber = trackingNumber;
      }

      await order.save();

      res.status(200).json({
        success: true,
        message: `Order status updated to ${status}`,
        notificationType: "ORDER_STATUS_UPDATED",
        data: order,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
);

// Update payment status
router.put("/:orderId/payment", authenticateToken, async (req, res) => {
  try {
    const { paymentStatus, paymentIntentId } = req.body;

    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check authorization
    if (order.buyerId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to order",
      });
    }

    order.paymentStatus = paymentStatus;
    if (paymentIntentId) {
      order.paymentIntentId = paymentIntentId;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Payment status updated",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Download purchased book file
router.get("/download/:bookId", authenticateToken, async (req, res) => {
  try {
    const { bookId } = req.params;

    // Verify buyer has purchased this book
    const order = await Order.findOne({
      buyerId: req.user.userId,
      "items.bookId": bookId,
      paymentStatus: "completed",
    }).populate("items.bookId", "bookFile title");

    if (!order) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have access to download this book. Make sure you have purchased it and payment is completed.",
      });
    }

    // Find the book in the order items
    const bookItem = order.items.find(
      (item) => item.bookId._id.toString() === bookId,
    );
    if (
      !bookItem ||
      !bookItem.bookId.bookFile ||
      !bookItem.bookId.bookFile.url
    ) {
      return res.status(404).json({
        success: false,
        message: "This book does not have a downloadable file available",
      });
    }

    const bookFile = bookItem.bookId.bookFile;
    const { getSignedDownloadUrl } = require("../services/s3Service");

    // Extract S3 key from URL
    if (bookFile.url.includes(".s3.")) {
      try {
        const urlParts = bookFile.url.split(".amazonaws.com/");
        if (urlParts.length === 2) {
          const s3Key = decodeURIComponent(urlParts[1]);
          // Generate signed URL with 24 hour expiry for files
          const result = await getSignedDownloadUrl(s3Key, 86400);

          if (result.success) {
            return res.status(200).json({
              success: true,
              message: "Download link generated",
              data: {
                downloadUrl: result.url,
                fileName: bookItem.bookId.title + ".pdf",
                expiresInHours: 24,
              },
            });
          }
        }
      } catch (error) {
        console.error("Error generating signed URL:", error);
      }
    }

    // Fallback: return the S3 URL directly if it's already accessible
    res.status(200).json({
      success: true,
      message: "Download link retrieved",
      data: {
        downloadUrl: bookFile.url,
        fileName: bookItem.bookId.title + ".pdf",
      },
    });
  } catch (error) {
    console.error("Book download error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process download",
    });
  }
});

module.exports = router;
