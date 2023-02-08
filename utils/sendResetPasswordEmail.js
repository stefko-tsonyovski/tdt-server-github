const sendEmail = require("./sendEmail");
const sendGrid = require("./sendgrid");

const sendResetPasswordEmail = async ({ name, email, token, origin }) => {
  const resetUrl = `${origin}/reset-password?token=${token}&email=${email}`;
  const message = `<p>Please reset password by clicking on the following link : 
    <a href=${resetUrl}>Reset Password</a></p>`;

  const msgInfo = {
    from: "mern.developers03@gmail.com",
    to: email,
    subject: "Reset Password",
    html: `<h4>Hello, ${name}</h4>
        ${message}`,
  };

  sendGrid(msgInfo);
  return sendEmail(msgInfo);
};

module.exports = sendResetPasswordEmail;
