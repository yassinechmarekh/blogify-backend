const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.APP_EMAIL_ADDRESS,
    pass: process.env.APP_EMAIL_PASSWORD,
  },
  // host: "sandbox.smtp.mailtrap.io",
  // port: 587,
  // secure: false,
  // auth: {
  //   user: process.env.MAIL_USER,
  //   pass: process.env.MAIL_PASS,
  // },
});

module.exports = (email, subject, templateHtml) => {
  return new Promise((resolve, reject) => {
    const mailOptions = {
      from: process.env.APP_EMAIL_ADDRESS,
      to: Array.isArray(email) ? email.join(",") : email,
      subject: subject,
      html: templateHtml,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Erreur d'envoi d'email :", error);
        return reject(error);
      }
      resolve(info.response);
    });
  });
};
