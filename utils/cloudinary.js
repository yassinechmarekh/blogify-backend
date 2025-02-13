const cloudinary = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload Image to cloudinary
const cloudinaryUploadImage = async (fileToUpload) => {
  try {
    const result = await cloudinary.uploader.upload(fileToUpload);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error("Internal Server Error (Cloudinary)");
  }
};

// Delete image from cloudinary
const cloudinarydeleteImage = async (imagePublicId) => {
  try {
    const result = await cloudinary.uploader.destroy(imagePublicId);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error("Internal Server Error (Cloudinary)");
  }
};

// Delete multiple image from cloudinary
const cloudinarydeleteMultiplrImage = async (publicIds) => {
  try {
    const result = await cloudinary.v2.api.delete_resources(publicIds);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error("Internal Server Error (Cloudinary)");
  }
};

module.exports = {
  cloudinaryUploadImage,
  cloudinarydeleteImage,
  cloudinarydeleteMultiplrImage,
};
