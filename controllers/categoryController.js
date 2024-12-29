const asyncHandler = require("express-async-handler");
const Category = require("../models/categoryModel");
const {
  createCategoryValidation, updateCategoryValidation,
} = require("../utils/validations/categoryValidation");
const path = require("path");
const fs = require("fs");
const { cloudinaryUploadImage, cloudinarydeleteImage } = require("../utils/cloudinary");
const slugify = require('slugify');

/**----------------------------------------
 * @desc Create category
 * @route /api/categories
 * @method POST
 * @access private (only admin)
 -----------------------------------------*/
module.exports.createCategoryController = asyncHandler(async (req, res) => {
  const { error } = createCategoryValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  if (!req.file) {
    return res.status(400).json({ message: "No image provieded !" });
  }

  const isExist = await Category.findOne({ title: req.body.title });
  if (isExist) {
    return res
      .status(400)
      .json({ message: "This category is already exist !" });
  }

  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
  const result = await cloudinaryUploadImage(imagePath);

  const category = new Category({
    title: req.body.title,
    slug: slugify(req.body.title),
    description: req.body.description,
    image: {
      url: result.secure_url,
      publicId: result.public_id,
    },
    icon: req.body.icon,
  });
  await category.save();

  res
    .status(201)
    .json({ message: "Category created successfully !", category });

    fs.unlinkSync(imagePath);
});

/**----------------------------------------
 * @desc Get all categories
 * @route /api/categories
 * @method GET
 * @access public
 -----------------------------------------*/
module.exports.getAllCategoriesController = asyncHandler(async (req, res) => {
  let { categoriesNumber, page } = req.query;
  page = page || 1;
  let categories;
  if (categoriesNumber) {
    categories = await Category.find()
      .skip((page - 1) * categoriesNumber)
      .limit(categoriesNumber)
      .sort({ createdAt: -1 });
  } else {
    categories = await Category.find().sort({ createdAt: -1 });
  }
  res.status(200).json(categories);
});

/**----------------------------------------
 * @desc Get specific category
 * @route /api/categories/:slug
 * @method GET
 * @access public
 -----------------------------------------*/
 module.exports.getCategeoryController = asyncHandler(async (req, res) => {
  const category = await Category.find({slug: req.params.slug});
  res.status(200).json(category);
 })

/**----------------------------------------
 * @desc Update category
 * @route /api/categories/:id
 * @method PUT
 * @access private (Only admin)
 -----------------------------------------*/
 module.exports.updateCategoryController = asyncHandler(async (req, res) => {
  // validation
  const {error} = updateCategoryValidation(req.body);
  if(error){
    return res.status(400).json({message: error.details[0].message});
  }
  // get category
  let category = await Category.findById(req.params.id);
  if(!category){
    return res.status(404).json({message: 'Category not found !'});
  }
  // check title already exist
  let slug;
  if(req.body.title){
    let isExist;
    isExist = await Category.findOne({slug: slugify(req.body.title)});
    if(isExist){
      return res.status(400).json({message: 'This category title is already exist !'});
    }
    slug = slugify(req.body.title);
  }else{
    slug = category.slug;
  }
  // update category
  category = await Category.findByIdAndUpdate(req.params.id,{
    $set: {
      title: req.body.title,
      slug: slug,
      description: req.body.description,
      icon: req.body.icon
    }
  },{new: true})
  // res to client
  res.status(200).json({message: 'Category updated successfully !', category});
 });

 /**----------------------------------------
 * @desc Update category image
 * @route /api/categories/upoad-image/:id
 * @method PUT
 * @access private (Only admin)
 -----------------------------------------*/
 module.exports.updateCategoryImageController = asyncHandler(async (req, res) => {
  // validation
  if(!req.file){
    return res.status(400).json({message: 'No image provided !'});
  }
  // get category
  const category = await Category.findById(req.params.id);
  if(!category){
    return res.status(404).json({message: 'Categroy not found !'});
  }
  // remove old image
  await cloudinarydeleteImage(category.image.publicId);
  // ulpload new image
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
  const result =  await cloudinaryUploadImage(imagePath);
  // update on db
  await Category.findByIdAndUpdate(req.params.id,{
    $set: {
      image: {
        url: result.secure_url,
        publicId: result.public_id
      }
    }
  },{new: true});
  // res to client
  res.status(200).json({message: 'Category image updated successfully !'});
  // delete image form server
  fs.unlinkSync(imagePath);
 });

 /**----------------------------------------
 * @desc Delete category 
 * @route /api/categories/:id
 * @method DELETE
 * @access private (Only admin)
 -----------------------------------------*/
 module.exports.deleteCategoryController = asyncHandler(async (req,res) => {
  const category = await Category.findById(req.params.id);
  if(!category){
    return res.status(404).json({message: 'Category not found !'});
  }

  await Category.findByIdAndDelete(req.params.id);
  
  await cloudinarydeleteImage(category.image.publicId);

  res.status(200).json({message: 'Category deleted successfully !'});
 });