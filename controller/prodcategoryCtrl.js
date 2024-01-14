const Category = require("../models/prodcategoryModel");
const validateMongoDbId = require("../utils/validateMongodbId");
const asyncHandler = require("express-async-handler");

// Create a new ProductCategory
const createCategory = asyncHandler(async (req, res) => {
    try {
        const newCategory = await Category.create(req.body);
        res.json(newCategory);
    } catch (error) {
        throw new Error(error);
    }
});

// Update a ProductCategory
const updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
      const updatedCategory = await Category.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      res.json(updatedCategory);
    } catch (error) {
      throw new Error(error);
    }
});

// Delete a ProductCategory
const deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
      const deletedCategory = await Category.findByIdAndDelete(id, req.body, {
        new: true,
      });
      res.json(deletedCategory);
    } catch (error) {
      throw new Error(error);
    }
});

// Get a ProductCategory
const getCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const getaCategory = await Category.findById(id);
        res.json(getaCategory);
    } catch (error) {
        throw new Error(error);
    }
});

// Get All Product Categories
const getAllCategory = asyncHandler(async (req, res) => {
    try {
        const getAllCategory = await Category.find();
        res.json(getAllCategory);
    } catch (error) {
        throw new Error(error);
    }
});

module.exports = { createCategory, updateCategory, deleteCategory, getCategory, getAllCategory };
