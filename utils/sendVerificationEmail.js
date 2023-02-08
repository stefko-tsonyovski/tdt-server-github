const sendEmail = require("./sendEmail");
const sendGrid = require("./sendgrid");

const sendVerificationEmail = async ({
  name,
  email,
  verificationToken,
  origin,
}) => {
  const verifyUrl = `${origin}/verify-email?token=${verificationToken}&email=${email}`;
  const message = `<p>Please verify email by clicking on the following link : 
    <a href=${verifyUrl}>Verify Email</a></p>`;

  const msgInfo = {
    from: "mern.developers03@gmail.com",
    to: email,
    subject: "Verification Email",
    html: `<h4>Hello ${name}</h4>
            ${message}`,
  };

  sendGrid(msgInfo);
  return sendEmail(msgInfo);
};

module.exports = sendVerificationEmail;
