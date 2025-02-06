const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");
const Order = require("../models/orderModel");
const uniqid = require("uniqid");
const asyncHandler = require("express-async-handler");
const { generateToken } = require("../config/jwtToken");
const validateMongoDbId = require("../utils/validateMongodbId");
const { generateRefreshToken } = require("../config/refreshtoken");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("./emailCtrl");
const { concurrency } = require("sharp");

// Create a User
// const createUser = async (req, res) => {
//   try {
//     const { firstName, lastName, email, password } = req.body;

//     // Check if required fields are present
//     if (!firstName || !lastName || !email || !password) {
//       return res.status(400).json({ success: false, message: "All fields are required." });
//     }

//     // Proceed with user registration
//     const newUser = new User({
//       firstName,
//       lastName,
//       email,
//       password
//     });

//     // Save user to the database
//     await newUser.save();

//     res.status(201).json({ success: true, message: "User registered successfully." });
//   } catch (error) {
//     console.error("Error registering user:", error);
//     res.status(500).json({ success: false, message: "Server error: " + error.message });
//   }
// };
const createUser = asyncHandler(async (req, res) => {
  const email = req.body.email;
  const findUser = await User.findOne({ email: email });
  if (!findUser) {
      // create a new user
      const newUser = await User.create(req.body);
      res.json(newUser);
  } else {
      throw new Error("The account already exists in the system.");
  }
})

// Login user

const loginUserCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // check if user exist or not
  const findUser = await User.findOne({ email });
  if (findUser && await findUser.isPasswordMatched(password)) {
      const refreshToken = await generateRefreshToken(findUser?._id);
      const updateuser = await User.findByIdAndUpdate(
          findUser?._id,
          {
              refreshToken: refreshToken,
          },
          { new: true }
      );
      res.cookie("refreshToken", refreshToken, { 
          httpOnly: true, 
          maxAge: 72 * 60 * 60 * 1000, 
      });
      res.json({
          _id: findUser?._id,
          firstName: findUser?.firstName,
          lastName: findUser?.lastName,
          email: findUser?.email,
          mobile: findUser?.mobile,
          address: findUser?.address,
          city: findUser?.city,
          isBlocked: findUser?.isBlocked,
          token: generateToken(findUser?._id),
          refreshToken: refreshToken,
      })
  } else {
      throw new Error("Incorrect information");
  }
})

// admin login

const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // check if user exists or not
  const findAdmin = await User.findOne({ email });
  if (findAdmin.role !== "admin") throw new Error("Not Authorised");
  if (findAdmin && (await findAdmin.isPasswordMatched(password))) {
      const refreshToken = await generateRefreshToken(findAdmin?._id);
      const updateuser = await User.findByIdAndUpdate(
          findAdmin?._id,
          {
              refreshToken: refreshToken,
          },
          { new: true }
      );
      res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          maxAge: 72 * 60 * 60 * 1000,
      });
      res.json({
          _id: findAdmin?._id,
          firstName: findAdmin?.firstName,
          lastName: findAdmin?.lastName,
          email: findAdmin?.email,
          mobile: findAdmin?.mobile,
          token: generateToken(findAdmin?._id),
          refreshToken: refreshToken,
      });
  } else {
      throw new Error("Incorrect information");
  }
});


// Handle a Refresh Token

const handleRefreshToken = asyncHandler(async (req, res) => { 
  const { refreshToken } = req.body;
  if (!refreshToken) throw new Error("No Refresh Token")
  const user = await User.findOne({ refreshToken });
  if (!user) throw new Error(" No Refresh token present in db or not matched");
  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
      if (err || user.id !== decoded.id) {
          throw new Error("There is something wrong with refresh token");
      }
      const accessToken = generateToken(user?._id);
      res.json({ accessToken });
  });
});

// Logout Functionality 

const logout = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie?.refreshToken) throw new Error ("No Refresh Token in Cookies"); 
    const refreshToken = cookie.refreshToken;
    const user = await User.findOne({ refreshToken });
    if (!user) {
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure : true,
        });
        return res.sendStatus(204); // forbidden
    }
    await User.findOneAndUpdate( { refreshToken }, {
        refreshToken: "",
    });
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure : true,
    });
    res.sendStatus(204); // forbidden 
});

// Update a User

const updatedUser = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongoDbId(_id);
    try {
        const updatedUser = await User.findByIdAndUpdate(_id, {
            firstname: req?.body?.firstname,
            lastname: req?.body?.lastname,
            email: req?.body?.email,
            mobile: req?.body?.mobile,
        }, 
        {
            new: true,
        });
        res.json(updatedUser);
    } catch (error) {
        throw new Error(error);
    }

});

// save user Address

const saveAddress = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongoDbId(_id);

    try {
        const updatedUser = await User.findByIdAndUpdate(_id, {
            address: req?.body?.address,
        }, 
        {
            new: true,
        });
        res.json(updatedUser);
    } catch (error) {
        throw new Error(error);
    }
});

// Get all Users

const getallUser = asyncHandler(async (req, res) => {
    try {
        const getUsers = await User.find();
        res.json(getUsers);
    } catch (error) {
        throw new Error(error);
    }
});

// Get a single user

const getaUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const getaUser = await User.findById(id);
        res.json({
            getaUser,
        });
        
    } catch (error) {
        throw new Error(error);
    }
})

// Delete a User

const deleteaUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const deleteaUser = await User.findByIdAndDelete(id);
        res.json({
            deleteaUser,
        });
        
    } catch (error) {
        throw new Error(error);
    }
})

// Block a User

const blockUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
  
    try {
      const blockusr = await User.findByIdAndUpdate(
        id,
        {
          isBlocked: true,
        },
        {
          new: true,
        }
      );
      res.json(blockusr);
    } catch (error) {
      throw new Error(error);
    }
});

// Unblock a User

const unblockUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
  
    try {
      const unblock = await User.findByIdAndUpdate(
        id,
        {
          isBlocked: false,
        },
        {
          new: true,
        }
      );
      res.json({
        message: "User UnBlocked",
      });
    } catch (error) {
      throw new Error(error);
    }
});

// Update the Password

const updatePassword = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { password } = req.body;
    validateMongoDbId(_id);
    const user = await User.findById(_id);
    if (password) {
        user.password = password;
        const updatedPassword = await user.save();
        res.json(updatedPassword);
    } else {
        res.json(user);
    }
});

// Forgot Password token

const forgotPasswordToken = asyncHandler (async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if(!user) throw new Error ("User not found with this email");
    try {
        const token = await user.createPasswordResetToken();
        await user.save();
        const resetURL = `Hi, Please follow this link to reset your password. This link is valid till 10 minutes from now. <a href='http://localhost:5000/api/user/reset-password/${token}'>Click Here</a>`;
        const data = {
            to: email,
            text: "Hey User",
            subject: "Forgot Password Link",
            htm: resetURL,
        };
        sendEmail(data);
        res.json(token);
    } catch (error) {
        throw new Error(error);
    }
});

// Reset password

const resetPassword = asyncHandler(async(req, res) => {
    const { password } = req.body;
    const { token } = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });
    if(!user) throw new Error(" Token Expired, Please try again later");
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.json(user);
});

// Wishlist

const getWishList = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  try {
      const findUser = await User.findById(_id).populate("wishlist");
      res.json(findUser);
  } catch (error) {
      throw new Error(error);
  }
});


// Cart list

const userCart = asyncHandler(async (req, res) => {
  const { productId, color, quantity, price, priceAfterDiscount } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    let newCart = await new Cart({
      // save lai gio hang moi
      userId: _id,
      productId,
      color,
      quantity,
      price,
      priceAfterDiscount,
    }).save();
    res.json(newCart);
  } catch (error) {
    throw new Error(error);
  }
});

// Get user cart information
const getUserCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const cart = await Cart.find({ userId: _id })
      .populate(
        "productId"
        // "_id title price totalAfterDiscount"
      )
      .populate("color");
    res.json(cart);
  } catch (error) {
    throw new Error(error);
  }
});

// delete a product in cart
const removeProductFromCart = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { cartItemId } = req.params;
    validateMongoDbId(_id);
    try {
        const deleteProductFromCart = await Cart.deleteOne({ userId: _id, _id: cartItemId })
        res.json(deleteProductFromCart);
    } catch (error) {
        throw new Error(error);
    }
});

// Empty the Cart
const emptyCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const deleteCart = await Cart.deleteMany({ userId: _id });
    res.json(deleteCart);
  } catch (error) {
    throw new Error(error);
  }
});

const updateProductQuantityFromCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { cartItemId, newQuantity } = req.params;
  validateMongoDbId(_id);
  let updateQuantity = true; // Check if the number of products in the child database is enough? New enough for updates

  try {
    const cartItem = await Cart.findOne({ userId: _id, _id: cartItemId });

    // Check the inventory quantity of the product in the order
    const product = await Product.findById(cartItem?.productId);
    if (product?.quantity < newQuantity) {
      updateQuantity = false;
    }

    if (updateQuantity) {
      cartItem.quantity = newQuantity;
      cartItem.save();
      res.json({
        cartItem,
        message: "SUCCESS",
      });
    } else {
      res.json({
        message: "ERR",
      });
    }
  } catch (error) {
    throw new Error(error);
  }
});

const createOrder = asyncHandler(async (req, res) => {
  const {
    itemsPrice,
    shippingPrice,
    totalPrice,
    orderItems,
    paymentMethod,
    shippingInfo,
    isPaid,
    paidAt,
  } = req.body;

  const { _id } = req.user;
  let updateQuantity = true; // Check if the number of products in the child database is enough? New enough for ordering
  let arrProduct = []; // There are no unquantifiable products in the database
  try {
    // Check the inventory quantity of each product in the order
    const promises = orderItems.map(async (item) => {
      const product = await Product.findById(item?.product);
      if (product?.quantity < item?.quantity) {
        updateQuantity = false;
        arrProduct.push({
          title: product.title,
          quantity: product.quantity,
        });
      }
      return updateQuantity;
    });

    // Wait for all promises to be resolved or rejected
    const results = await Promise.all(promises);

    console.log("results: ", results);
    console.log("updateQuantity: ", updateQuantity);
    console.log("arrProduct: ", arrProduct);

    // All products are in stock -> create new orders and update inventory and sold quantities
    if (updateQuantity) {
      const createdOrder = await Order.create({
        itemsPrice,
        shippingPrice,
        totalPrice,
        orderItems,
        paymentMethod,
        shippingInfo,
        isPaid,
        paidAt,
        user: _id,
      });

      // Update inventory and sold quantity for each product in the order
      const updatePromises = orderItems.map(async (item) => {
        const product = await Product.findById(item?.product);
        product.quantity -= item?.quantity;
        product.sold += item?.quantity;
        await product.save();
        return true;
      });

      // Wait for all promises to be resolved or rejected
      await Promise.all(updatePromises);

      if (createOrder) {
        res.json({
          createdOrder,
          message: "SUCCESS",
        });
      }
    } else {
      res.json({
        message: "ERR",
        product: arrProduct,
      });
    }
  } catch (error) {
    throw new Error(error);
  }
});

const getMyOrders = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  try {
    const orders = await Order.find({ user: _id })
      .populate("user")
      .populate("orderItems.product")
      .populate("orderItems.color")
      .sort("-createdAt"); // Sort by creation time in descending order
    res.json({
      orders,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const getAllOrders = asyncHandler(async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user")
      .populate("orderItems.product")
      .sort("-createdAt"); // Sort by creation time in descending order C1
    res.json({
      orders,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const getSingleOrders = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const aOrder = await Order.findOne({ _id: id })
      .populate("user")
      .populate("orderItems.product");

    res.json(aOrder);
  } catch (error) {
    throw new Error(error);
  }
});

const updateOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const orders = await Order.findById(id);
    orders.orderStatus = req.body.status;
    orders.save();
    res.json({
      orders,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orderItems } = req.body;
  try {
    const cancelAOrder = await Order.findByIdAndUpdate(id, {
      orderStatus: "Cancelled",
    });

    // Update inventory and sold quantity for each product in the order
    const updatePromises = orderItems.map(async (item) => {
      const product = await Product.findById(item?.product._id);
      product.quantity += item?.quantity;
      product.sold -= item?.quantity;
      await product.save();
      return true;
    });

    // Wait for all promises to be resolved or rejected
    await Promise.all(updatePromises);

    res.json({
      cancelAOrder,
    });
  } catch (error) {
    throw new Error(error);
  }
});
const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findById(id);

    // Update inventory and sold quantity for each product in the order
    const updatePromises = order?.orderItems?.map(async (item) => {
      const product = await Product.findById(item?.product._id);
      product.quantity += item?.quantity;
      product.sold -= item?.quantity;
      await product.save();
      return true;
    });

    // Wait for all promises to be resolved or rejected
    await Promise.all(updatePromises);

    const deleteAOrder = await Order.findByIdAndDelete(id);
    res.json({
      deleteAOrder,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const getMonthWiseOrderIncome = asyncHandler(async (req, res) => {
  let monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  d = new Date();
  let endDate = "";
  d.setDate(1);
  for (let index = 0; index < 11; index++) {
    d.setMonth(d.getMonth() - 1);
    endDate = monthNames[d.getMonth()] + " " + d.getFullYear();
  }
  // console.log(endDate)
  const data = await Order.aggregate([
    {
      $match: {
        // Locate orders
        createdAt: {
          $lte: new Date(),
          $gte: new Date(endDate),
        },
        orderStatus: { $ne: "Cancelled" }, // Add the $ne (not equal) condition to $match to only retrieve orders with an orderStatus other than "Cancelled".
      },
    },
    {
      $group: {
        //group of stores
        _id: {
          // group conditions
          month: { $month: "$createdAt" },
        },
        amount: { $sum: "$totalPrice" }, // perform calculations
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        "_id.month": 1, // Sort by month ascending
      },
    },
  ]);
  res.json(data);
});

const getYearlyTotalOrders = asyncHandler(async (req, res) => {
  let monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  d = new Date();
  let endDate = "";
  d.setDate(1);
  for (let index = 0; index < 11; index++) {
    d.setMonth(d.getMonth() - 1);
    endDate = monthNames[d.getMonth()] + " " + d.getFullYear();
  }
  // console.log(endDate)
  const data = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $lte: new Date(),
          $gte: new Date(endDate),
        },
        orderStatus: { $ne: "Đã Hủy" }, // Add the $ne (not equal) condition to $match to only retrieve orders with an orderStatus other than "Cancelled".
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
        },
        count: { $sum: 1 },
        amount: { $sum: "$totalPrice" },
      },
    },
    {
      $sort: {
        "_id.year": 1, // Sort by year ascending
      },
    },
  ]);
  res.json(data);
});

const countLowStockProducts = asyncHandler(async (req, res) => {
  try {
    const lowStockProductsCount = await Product.aggregate([
      {
        $match: {
          quantity: { $lte: 15 }, // Only take products with quantities less than or equal to 15
        },
      },
      {
        $count: "lowStockCount", // Count the number of products whose quantity is less than or equal to 15
      },
    ]);

    // The returned result will be an array. If the array is empty, it means there are no products that satisfy the condition
    const count =
      lowStockProductsCount.length > 0
        ? lowStockProductsCount[0].lowStockCount
        : 0;

    res.json(count);
  } catch (error) {
    console.error(error);
  }
});

const calculateCategoryRevenue = asyncHandler(async (req, res) => {
  try {
    const categoryRevenue = await Order.aggregate([
      {
        $match: {
          orderStatus: { $ne: "Cancelled" },
        },
      },
      {
        $unwind: "$orderItems",
      },
      {
        $lookup: {
          from: "products", // The name of the product collection
          localField: "orderItems.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $group: {
          _id: "$productDetails.category",
          totalRevenue: { $sum: "$orderItems.priceAfterDiscount" },
        },
      },
      {
        $sort: {
          totalRevenue: -1, // Sort by revenue descending
        },
      },
    ]);

    res.json(categoryRevenue);
  } catch (error) {
    console.error(error);
  }
});

const inventoryStatsByCategory = asyncHandler(async (req, res) => {
  try {
    const inventoryStats = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          totalQuantity: { $sum: "$quantity" },
        },
      },
      {
        $sort: {
          totalQuantity: 1, // Sort up ascending
        },
      },
    ]);

    res.json(inventoryStats);
  } catch (error) {
    console.error(error);
  }
});

const getOrderStatusCounts = asyncHandler(async (req, res) => {
  try {
    const orderStatusCounts = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    res.json(orderStatusCounts);
  } catch (error) {
    console.error(error);
  }
});

const getPaymentMethodCounts = asyncHandler(async (req, res) => {
  try {
    const paymentMethodCounts = await Order.aggregate([
      {
        $match: {
          orderStatus: { $ne: "Cancelled" },
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    res.json(paymentMethodCounts);
  } catch (error) {
    console.error(error);
  }
});

// Apply coupon
// const applyCoupon = asyncHandler(async (req, res) => {
//   const { coupon } = req.body;
//   const { _id } = req.user;
//   validateMongoDbId(_id);
//   const validCoupon = await Coupon.findOne({ name: coupon });
//   if (validCoupon === null) {
//     throw new Error("Invalid Coupon");
//   }
//   const user = await User.findOne({ _id });
//   let { cartTotal } = await Cart.findOne({ orderby: _id }).populate("products.product");
//   let totalAfterDiscount = (cartTotal - (cartTotal * validCoupon.discount)/100).toFixed(2);
//   await Cart.findOneAndUpdate(
//     { orderby: user._id }, 
//     { totalAfterDiscount }, 
//     { new: true }
//   );
//   res.json(totalAfterDiscount);  
// });

// Create Cash Order
// const createOrder = asyncHandler(async (req, res) =>{
//   const { COD, couponApplied } = req.body;
//   const { _id } = req.user;
//   validateMongoDbId(_id);
//   try {
//     if (!COD) throw new Error("Create cash order failed");
//     const user = await User.findById(_id);
//     let userCart = await Cart.findOne({ orderby: user._id });
//     let finalAmount = 0;
//     if(couponApplied && userCart.totalAfterDiscount) {
//       finalAmount = userCart.totalAfterDiscount;
//     } else{
//       finalAmount = userCart.cartTotal * 100;
//     }
//     let newOrder = await new Order({
//       products: userCart.products,
//       paymentIntent: {
//         id: uniqid(),
//         method: "COD",
//         amount: finalAmount,
//         status: "Cash on Delivery",
//         created: Date.now(),
//         currency: "USD",
//       },
//       orderby: user._id,
//       orderStatus: "Cash on Delivery",
//     }).save();
//     let update = userCart.products.map((item) => {
//       return {
//         updateOne: {
//           filter: { _id: item.product._id },
//           update: {$inc: { quantity: -item.count, sold: +item.count } },
//         },
//       };
//     });
//     const updated = await Product.bulkWrite(update, {});
//     res.json({ message: "success" });
//   } catch (error) {
//     throw new Error(error);
//   }
// });

// Get Users Orders
// const getOrders = asyncHandler(async (req, res) => {
//   const { _id } = req.user;
//   validateMongoDbId(_id);
//   try {
//     const userorders = await Order.findOne( { orderby: _id }).populate("products.product").exec();
//     res.json(userorders);
//   } catch (error) {
//     throw new Error(error);
//   }
// });

// Update Order Status
// const updateOrderStatus = asyncHandler(async (req, res) => {
//   const { status } = req.body;
//   const { id } = req.params;
//   validateMongoDbId(id);
//   try {
//     const updateOrderStatus = await Order.findByIdAndUpdate(
//       id, 
//       {
//         orderStatus: status,
//         paymentIntent: {
//           status: status,
//         },
//       }, 
//       { new: true }
//     );
//     res.json(updateOrderStatus);
//   } catch (error) {
//     throw new Error(error);
//   }
// });





module.exports = {
  createUser,
  loginUserCtrl,
  getallUser,
  getaUser,
  deleteaUser,
  updatedUser,
  blockUser,
  unblockUser,
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
  removeProductFromCart,
  updateProductQuantityFromCart,
  createOrder,
  getMyOrders,
  getAllOrders,
  getSingleOrders,
  updateOrder,
  cancelOrder,
  getMonthWiseOrderIncome,
  getYearlyTotalOrders,
  calculateCategoryRevenue,
  getOrderStatusCounts,
  getPaymentMethodCounts,
  countLowStockProducts,
  inventoryStatsByCategory,
  deleteOrder,
  emptyCart,
};
