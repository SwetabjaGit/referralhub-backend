const nodemailer = require("nodemailer");

module.exports = async (email, subject, url) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      service: process.env.SERVICE,
      port: Number(process.env.EMAIL_PORT),
      secure: Boolean(process.env.SECURE),
      auth: {
        user: process.env.USER,
        pass: process.env.PASS,
      },
    });

    const emailBody = `Hi there,

Thank you for signing up. Click on the link below to verify your email:

${url}

This link will expire in 24 hours.
      
Thanks`;

    await transporter.sendMail({
      from: process.env.USER,
      to: email,
      subject: subject,
      text: emailBody,
    });

    console.log("Email sent successfully");
  } catch (error) {
    console.log("Email not sent!");
    console.log(error);
    return error;
  }
};
