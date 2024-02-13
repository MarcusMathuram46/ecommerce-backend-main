const Product = require("../models/productModel");
const User = require("../models/userModel");
const Supplier = require("../models/supplierModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const validateMongoDbId = require("../utils/validateMongodbId");
const fs = require("fs");
const { cloudinaryUploadImg, cloudinaryDeleteImg } = require("../utils/cloudinary");
const mongoose = require('mongoose');



// Create a New Product
// Create a New Product
const createProduct = asyncHandler(async (req, res, next) => {
  try {
    // Validate request body
    if (!req.body.title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Validate supplierID
    
    const { supplierID } = req.body;
    if (!supplierID) {
      return res.status(400).json({ error: 'Supplier ID is required' });
    }
    // Validate the format of supplierID
    if (!mongoose.Types.ObjectId.isValid(supplierID)) {
      return res.status(400).json({ error: 'Invalid supplier ID format' });
    }

    // Query the Supplier model with the validated supplierID
    const supplier = await Supplier.findById(supplierID);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Generate slug
    req.body.slug = slugify(req.body.title);

    // Create product
    const newProduct = await Product.create(req.body);

    // Send response
    res.json(newProduct);
  } catch (error) {
    // Pass error to error-handling middleware
    next(error);
  }
});






// Update the Product
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  if (req.body.title) {
      req.body.slug = slugify(req.body.title);
  }
  const updatedProduct = await Product.findOneAndUpdate({ _id: id }, req.body, {
      new: true,
  });
  res.json(updatedProduct);
});

// Delete the Product
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  const deletedProduct = await Product.findOneAndDelete({ _id: id });
  res.json(deletedProduct);
});

// Get a Product
const getaProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  const product = await Product.findById(id);
  res.json(product);
});

// Get Products by Supplier
const getProductbySupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const products = await Product.find({ supplierID: id });
  res.json(products);
});


// Get All Products

const getAllProduct = asyncHandler(async (req, res) => {
    try {
        // Filtering

        const queryObj = { ...req.query };
        const excludeFields = ["page", "sort", "limit", "fields"];
        excludeFields.forEach((el) => delete queryObj[el]);
        console.log(queryObj);
        let queryStr = JSON.stringify(queryObj);
        queryStr= queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        let query = Product.find(JSON.parse(queryStr));

        // Sorting

        if(req.query.sort) {
            const sortBy = req.query.sort.split(",").join(" ");
            query= query.sort(sortBy);
        }else {
            query = query.sort("-createdAt");
        }

        // Limiting the fields

        if(req.query.fields) {
            const fields = req.query.fields.split(",").join(" ");
            query= query.select(fields);
        }else {
            query = query.select("-__v")
        }

        // Pagination

        const page = req.query.page;
        const limit = req.query.limit;
        const skip = (page - 1) * limit;
        query = query.skip(skip).limit(limit);
        if(req.query.page) {
            const productCount= await Product.countDocuments();
            if (skip >= productCount) throw new Error("This Page does not exists")
        }
        console.log(page, limit, skip);

        const product = await query;
        res.json(product);
    } catch (error) {
        throw new Error(error);
    }
});

// Wishlist Functionality

const addToWishlist = asyncHandler(async(req, res) => {
    const { _id } = req.user;
    const { prodId } = req.body;
    try {
        const user = await User.findById(_id);
        const alreadyadded = user.wishlist.find((id) => id.toString() === prodId);
        if (alreadyadded) {
            let user = await User.findByIdAndUpdate(_id, {
                $pull: {wishlist: prodId},
            },
            {
                new: true,
            });
            res.json(user);
        } else {
            let user = await User.findByIdAndUpdate(_id, {
                $push: {wishlist: prodId},
            },
            {
                new: true,
            });
            res.json(user);
        }
    } catch (error) {
        throw new Error(error);
    }
});

// Total Ratings

const rating = asyncHandler(async (req, res) => {
    const { _id } = req.user || {};
    const { star, prodId, comment } = req.body;
  
    try {
      const product = await Product.findById(prodId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const alreadyRated = product.ratings.find(
        (rating) =>
          rating.postedby &&
          rating.postedby.toString() === (_id && _id.toString())
      );

      if (alreadyRated) {
        // Update the existing rating's star and comment
        const updateRating = await Product.updateOne(
          {
            ratings: { $elemMatch: alreadyRated }, // Find the user's reputation with ratings
          },
          {
            $set: { "ratings.$.star": star, "ratings.$.comment": comment }, //Set the value again
          },
          {
            new: true,
          }
        );
      } else {
        // Add a new rating if the user hasn't rated the product yet
        const rateProduct = await Product.findByIdAndUpdate(
          prodId,
          {
            $push: {
              // them danh gia
              ratings: {
                star: star,
                comment: comment,
                postedby: _id,
              },
            },
          },
          {
            new: true,
          }
        );
      }

      const updatedProduct = await Product.findById(prodId);
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      const getallratings = await Product.findById(prodId);
      let totalRating = getallratings.ratings.length; // Lay the total number of famous people
      let ratingsum = getallratings.ratings
        .map((item) => item.star) // What is the difference between the stars and the stars?
        .reduce((prev, curr) => prev + curr, 0); // Lay the total number of famous stars, 0 is the initial value
      let actualRating = Math.round(ratingsum / totalRating);
      let finalproduct = await Product.findByIdAndUpdate(
        prodId,
        {
          totalrating: actualRating,
        },
        { new: true }
      );
      res.json(finalproduct);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
});

// Upload images of the product
const uploadImages = asyncHandler(async (req, res) => {
  try {
      if (!req.files || !req.files.length) {
          return res.status(400).json({ message: 'No files uploaded' });
      }
      const uploader = (path) => cloudinaryUploadImg(path, "images");
      const urls = [];
      const files = req.files;
      for (const file of files) {
          const { path } = file;
          const newpath = await uploader(path);
          urls.push(newpath);

          // Asynchronously delete the file
          fs.unlink(path, (err) => {
              if (err) {
                  console.error('Error deleting file:', err);
              } else {
                  console.log('File deleted successfully');
              }
          });
      }
      const images = urls.map((file) => {
          return file;
      });
      res.json(images);
  } catch (error) {
      console.error("Error uploading images:", error);
      res.status(500).json({ message: "Internal Server Error" });
  }
});

// Delete images of the Product
const deleteImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
      const deleted = cloudinaryDeleteImg(id, "images");
      if (!deleted) {
          return res.status(404).json({ message: "Image not found" });
      }
      res.json({ message: "Image deleted successfully" });
  } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({ message: "Internal Server Error" });
  }
});




module.exports = {
  createProduct,
  getaProduct,
  getAllProduct,
  updateProduct,
  deleteProduct,
  addToWishlist,
  rating,
  getProductbySupplier,
  uploadImages,
  deleteImages
};