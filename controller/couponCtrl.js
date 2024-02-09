const Coupon = require("../models/couponModel");
const validateMongoDbId = require("../utils/validateMongodbId");
const asyncHandler = require("express-async-handler");

// create a new Coupon
const createCoupon = asyncHandler(async (req, res) => {
  try {
    // Validate required fields
    const { discount, expiry, name } = req.body;
    if (!discount || !expiry || !name) {
      return res.status(400).json({
        status: "fail",
        message: "Validation error: discount, expiry, and name are required.",
      });
    }

    const newCoupon = await Coupon.create(req.body);
    res.status(201).json({
      status: "success",
      message: "Coupon created successfully.",
      data: newCoupon,
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});


// getAllCoupons without populating 'product'
const getAllCoupons = asyncHandler(async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

const getCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const getAcoupon = await Coupon.findById(id);
    res.json(getAcoupon);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});





// Update a Coupon
const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const updatecoupon = await Coupon.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(updatecoupon);
  } catch (error) {
    throw new Error(error);
  }
});

// Delete a Coupon
const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const deletecoupon = await Coupon.findByIdAndDelete(id);
    res.json(deletecoupon);
  } catch (error) {
    throw new Error(error);
  }
});


module.exports = {
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  getCoupon,
};
