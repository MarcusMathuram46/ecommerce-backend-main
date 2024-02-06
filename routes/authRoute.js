const express = require("express");
const {
  createUser,
  loginUserCtrl,
  getallUser,
  getaUser,
  deleteaUser,
  updatedUser,
  unblockUser,
  blockUser,
  handleRefreshToken,
  logout,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
  loginAdmin,
  getWishList,
  saveAddress,
  userCart,
  getUserCart,
  emptyCart,
  applyCoupon,
  createOrder,
  removeProductFromCart,
  updateProductQuantityFromCart,
  getMyOrders,
  getMonthWiseOrderIncome,
  getYearlyTotalOrders,
  getAllOrders,
  getSingleOrders,
  updateOrder,
  deleteOrder,
  getOrders,
  updateOrderStatus,
  cancelOrder,
  calculateCategoryRevenue,
  getOrderStatusCounts,
  countLowStockProducts,
  inventoryStatsByCategory,
  getPaymentMethodCounts,
} = require("../controller/userCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const { checkout, paymentVerification } = require("../controller/paymentCtrl");
const router = express.Router();

router.post("/register", createUser);

router.post("/forgot-password-token", forgotPasswordToken);
router.put("/reset-password/:token", resetPassword);
router.put("/password", authMiddleware, updatePassword);
// router.put("/order/update-order/:id", authMiddleware, isAdmin, updateOrderStatus);

router.post("/login", loginUserCtrl);
router.post("/admin-login", loginAdmin);
router.post("/cart", authMiddleware, userCart);
router.post("/order/checkout", authMiddleware, checkout);
router.post("/order/paymentVerification", authMiddleware, paymentVerification);
// router.post("/cart/applycoupon", authMiddleware, applyCoupon);
router.post("/cart/create-order", authMiddleware, createOrder);
router.get("/all-users", getallUser);
router.get("/getmyorders", authMiddleware, getMyOrders);
router.get("/getallorders", authMiddleware, isAdmin, getAllOrders);
router.get("/getaOrder/:id", authMiddleware, getSingleOrders);
router.put("/updateOrder/:id", authMiddleware, updateOrder);
router.put("/cancelOrder/:id", authMiddleware, cancelOrder);
// router.get("/getorderbyuser/:id", authMiddleware, isAdmin, getOrderByUserId);
// router.post("/getorderbyuser/:id", authMiddleware, isAdmin, getAllOrders);
router.post("/refresh", handleRefreshToken);
router.get("/logout", logout);
router.get("/wishlist", authMiddleware, getWishList);
router.get("/cart", authMiddleware, getUserCart);
router.get("/getMonthWiseOrderIncome", authMiddleware, getMonthWiseOrderIncome);
router.get("/getYearlyTotalOrders", authMiddleware, getYearlyTotalOrders);
router.get("/getCategoryRevenue", authMiddleware, calculateCategoryRevenue);
router.get("/getOrderStatusCounts", authMiddleware, getOrderStatusCounts);
router.get("/getPaymentMethodCounts", authMiddleware, getPaymentMethodCounts);
router.get("/countLowStockProducts", authMiddleware, countLowStockProducts);
router.get(
  "/inventoryStatsByCategory",
  authMiddleware,
  inventoryStatsByCategory
);

router.get("/:id", authMiddleware, getaUser);
router.delete(
  "/delete-product-cart/:cartItemId",
  authMiddleware,
  removeProductFromCart
);
router.delete(
  "/update-product-cart/:cartItemId/:newQuantity",
  authMiddleware,
  updateProductQuantityFromCart
);
router.delete("/empty-cart", authMiddleware, emptyCart);
router.delete("/:id", deleteaUser);
router.delete("/deleteOrder/:id", authMiddleware, isAdmin, deleteOrder);

router.put("/edit-user", authMiddleware, updatedUser);
router.put("/save-address", authMiddleware, saveAddress);
router.put("/block-user/:id", authMiddleware, isAdmin, blockUser);
router.put("/unblock-user/:id", authMiddleware, isAdmin, unblockUser);


module.exports = router;