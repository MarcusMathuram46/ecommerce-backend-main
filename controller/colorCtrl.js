const Color = require("../models/colorModel");
const validateMongoDbId = require("../utils/validateMongodbId");
const asyncHandler = require("express-async-handler");

// Create a Color
const createColor = asyncHandler(async (req, res) => {
    try {
        const newColor = await Color.create(req.body);
        res.json(newColor);
    } catch (error) {
        throw new Error(error);
    }
});

// Update a Color
const updateColor = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
      const updatedColor = await Color.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      res.json(updatedColor);
    } catch (error) {
      throw new Error(error);
    }
});

// Delete a Color
const deleteColor = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
      const deletedColor = await Color.findByIdAndDelete(id, req.body, {
        new: true,
      });
      res.json(deletedColor);
    } catch (error) {
      throw new Error(error);
    }
});

// Get a color
const getColor = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const getaColor = await Color.findById(id);
        res.json(getaColor);
    } catch (error) {
        throw new Error(error);
    }
});

// Get All Colors
const getAllColor = asyncHandler(async (req, res) => {
    try {
        const getAllColor = await Color.find();
        res.json(getAllColor);
    } catch (error) {
        throw new Error(error);
    }
});

module.exports = { createColor, updateColor, deleteColor, getColor, getAllColor };
