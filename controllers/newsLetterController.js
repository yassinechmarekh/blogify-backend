const NewsLetter = require("../models/newsLetterModel");
const asyncHandler = require("express-async-handler");
const {
  addEmailToNewsLetterValidation,
} = require("../utils/validations/newsLetterValidation");

/**----------------------------------------
 * @desc Add email to newsLetter
 * @route /api/newsletter
 * @method POST
 * @access public
 -----------------------------------------*/
module.exports.addEmailToNewsLetterController = asyncHandler(
  async (req, res) => {
    const { error } = addEmailToNewsLetterValidation(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const isExist = await NewsLetter.find({ email: req.body.email });
    if (isExist.length > 0) {
      return res
        .status(400)
        .json({
          message: `${req.body.email} is already exist on our newsletter !`,
        });
    }

    const newEmail = new NewsLetter({
      email: req.body.email,
    });
    await newEmail.save();

    res
      .status(201)
      .json({ message: `${newEmail.email} is added on our newsletter` });
  }
);

/**----------------------------------------
 * @desc Get all email in newsletter
 * @route /api/newsletter
 * @method GET
 * @access private (Only admin)
 -----------------------------------------*/
module.exports.getNewsletterController = asyncHandler(async (req, res) => {
  const newsLetter = await NewsLetter.find().sort({ createdAt: -1 });
  res.status(200).json(newsLetter);
});

/**----------------------------------------
 * @desc Update newsletter
 * @route /api/newsletter/:id
 * @method PUT
 * @access private (Only admin)
 -----------------------------------------*/
module.exports.updateNewsLetterController = asyncHandler(async (req, res) => {
  const newsLetter = await NewsLetter.findOne({ _id: req.params.id });
  if (!newsLetter) {
    return res.status(404).json({ message: "Invalid Id !" });
  }

  const updatedNewsLetter = await NewsLetter.findByIdAndUpdate(
    req.params.id,
    { notification: !newsLetter.notification },
    { new: true }
  );

  const status = updatedNewsLetter.notification ? "active" : "inactive";
  return res.status(200).json({
    message: `Notification is ${status} for ${updatedNewsLetter.email}`,
  });
});

/**----------------------------------------
 * @desc Delete email from newletter
 * @route /api/newsletter/:id
 * @method DELETE
 * @access private (Only admin)
 -----------------------------------------*/
 module.exports.deleteFromNewsletter = asyncHandler(async (req, res) => {
    const newsLetter = await NewsLetter.findById(req.params.id);
    if(!newsLetter){
        return res.status(404).json({message: 'Invalid Id !'});
    }

    await NewsLetter.findOneAndDelete({_id: req.params.id});

    res.status(200).json({message: `${newsLetter.email} is delete from newsletter !`});
 });

/**----------------------------------------
 * @desc Delete many emails from newsletter
 * @route /api/newsletter
 * @method DELETE
 * @access private (Only admin)
 -----------------------------------------*/
 module.exports.deleteManyEmailsFromNewsletterController = asyncHandler(async (req, res) => {
  const {emailsIds} = req.body;
  if(!emailsIds || !Array.isArray(emailsIds) || emailsIds.length === 0){
    return res.status(400).json({message: 'No emails selected !'});
  }

  const emails = await NewsLetter.find({_id: {$in: emailsIds}});
  if(emails.length !== emailsIds.length) {
    return res.status(404).json({message: 'One or more email not found !'});
  }

  const result = await NewsLetter.deleteMany({_id: {$in: emailsIds}});

  res.status(200).json({message: `${result.deletedCount} email(s) deleted succussfully !`});
 });