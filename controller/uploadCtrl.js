const {
  cloudinaryUploadImg,
  cloudinaryDeleteImg,
} = require("../utils/cloudinary");
const fs = require("fs");
const asyncHandler = require("express-async-handler");

const uploadImages = asyncHandler(async (req, res) => {
  try {
    const uploader = (path) => cloudinaryUploadImg(path, "images");
    const urls = [];
    const files = req.files; // get all files from Frontend
    
    console.log("Received files:", files); // Log received files for debugging
    
    for (const file of files) {
      const { path } = file;
      console.log("Uploading file:", path); // Log the path of each file being uploaded
      const newpath = await uploader(path);
      console.log("Uploaded file:", newpath); // Log the uploaded file path
      urls.push(newpath);
      try {
        fs.unlinkSync(path); // delete image file
        console.log("Deleted file:", path); // Log the deleted file path
      } catch (error) {
        console.error("Error deleting file:", error);
      }
    }
    
    const images = urls.map((file) => file);
    console.log("Uploaded images:", images); // Log the array of uploaded image URLs
    
    res.json(images);
  } catch (error) {
    console.error("Error uploading images:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});



const deleteImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await cloudinaryDeleteImg(id, "images"); // Await the deletion process
    res.json({
      deletedImageId: id,
      message: "Deleted",
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

module.exports = {
  uploadImages,
  deleteImages,
};
