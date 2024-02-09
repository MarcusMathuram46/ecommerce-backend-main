const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/images/"));
  },
  filename: function (req, file, cb) {
    const uniquesuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniquesuffix + ".jpeg");
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb({ message: "Unsupported file format" }, false);
  }
};

const uploadPhoto = multer({
  storage: storage,
  fileFilter: multerFilter,
  limits: { fileSize: 1000000 },
});

// Middleware to resize product images
const productImgResize = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    await Promise.all(
      req.files.map(async (file) => {
        const resizedImagePath = `public/images/products/${file.filename}`;
        console.log("Resized image path:", resizedImagePath);

        await sharp(file.path)
          .resize(300, 300)
          .toFormat("jpeg")
          .jpeg({ quality: 90 })
          .toFile(resizedImagePath)
          .then(() => {
            console.log("Resized image successfully saved:", resizedImagePath);
            fs.unlinkSync(file.path);
          })
          .catch((error) => {
            console.error("Error resizing image:", error);
          });
      })
    );
    next();
  } catch (error) {
    console.error("Error resizing image:", error);
    next(error);
  }
};





const blogImgResize = async (req, res, next) => {
  if (!req.files) return next();
  await Promise.all(
    req.files.map(async (file) => {
      await sharp(file.path)
        .resize(300, 300)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/images/blogs/${file.filename}`);
      fs.unlinkSync(`public/images/blogs/${file.filename}`);
    })
  );
  next();
};
module.exports = { uploadPhoto, productImgResize, blogImgResize };