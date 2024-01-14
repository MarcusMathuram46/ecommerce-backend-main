const Product = require("../models/productModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const validateMongoDbId = require("../utils/validateMongodbId");
const fs = require("fs");
const { cloudinaryUploadImg, cloudinaryDeleteImg } = require("../utils/cloudinary");

// Create a New Product
const createProduct = asyncHandler(async (req, res) => {
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title);
        }
        const newProduct = await Product.create(req.body);
        res.json(newProduct);
    } catch (error) {
        throw new Error(error);
    }
});

// Update the Product
const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params; // Correctly extract 'id' from req.params
    validateMongoDbId(id);
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title);
        }
        const updateProduct = await Product.findOneAndUpdate({ _id: id }, req.body, {
            new: true,
        });
        res.json(updateProduct);
    } catch (error) {
        throw new Error(error);
    }
});

// Delete the Product
const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params; // Correctly extract 'id' from req.params
    validateMongoDbId(id);
    try {
        const deleteProduct = await Product.findOneAndDelete(id);
        res.json(deleteProduct);
    } catch (error) {
        throw new Error(error);
    }
});


// Get the Product

const getaProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const findProduct = await Product.findById(id);
        res.json(findProduct);
    } catch (error) {
        throw new Error(error);
    }
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
          rating.postedby && rating.postedby.toString() === (_id && _id.toString())
      );
  
      if (alreadyRated) {
        // Update the existing rating's star and comment
        alreadyRated.star = star;
        alreadyRated.comment = comment;
        await product.save();
      } else {
        // Add a new rating if the user hasn't rated the product yet
        product.ratings.push({
          star: star,
          comment: comment,
          postedby: _id,
        });
        await product.save();
      }
  
      const updatedProduct = await Product.findById(prodId);
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      const totalRating = updatedProduct.ratings.length;
      const ratingsum = updatedProduct.ratings.reduce((acc, item) => acc + item.star, 0);
      const actualRating = totalRating > 0 ? Math.round(ratingsum / totalRating) : 0;
  
      updatedProduct.totalrating = actualRating;
      await updatedProduct.save();
  
      res.json(updatedProduct);
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
        throw new Error(error);
    }
});

// Delete images of the Product
const deleteImages = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = cloudinaryDeleteImg(id, "images");
        res.json({ message: "Deleted" });

    } catch (error) {
        throw new Error(error);
    }
});




module.exports = { createProduct, getaProduct, getAllProduct, updateProduct, deleteProduct, addToWishlist, rating, uploadImages, deleteImages, };