const cloudinary = require("cloudinary");

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.SECRET_KEY,
});

// Function to upload an image to Cloudinary
const cloudinaryUploadImg = async (fileToUpload) => {
    try {
        const result = await cloudinary.uploader.upload(fileToUpload, { resource_type: "auto" });
        return {
            url: result.secure_url,
            asset_id: result.asset_id,
            public_id: result.public_id,
        };
    } catch (error) {
        console.error("Error uploading image to Cloudinary:", error);
        throw error; // Re-throw the error to be caught by the caller
    }
};

// Function to delete an image from Cloudinary
// Function to delete an image from Cloudinary
const cloudinaryDeleteImg = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
        throw error; // Re-throw the error to be caught by the caller
    }
};


module.exports = { cloudinaryUploadImg, cloudinaryDeleteImg };
