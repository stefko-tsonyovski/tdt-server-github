const sendEmail = require("./sendEmail");
const sendGrid = require("./sendgrid");
const fs = require("fs");
const path = require("path");

const sendInvitationEmail = async ({ email, origin }) => {
  let templatePath = path.resolve("invitation-email-template.html");

  const html = fs.readFileSync(templatePath).toString();
  // const message = `<p>Welcome! We are happy to join us in our fantastic game TennisDreamTeam.
  //   You can help the person that sent you this invitation by verifying it by clicking the following link:
  //   <a href=${resetUrl}>Check out the app on Google Play Store</a></p>`;

  const msgInfo = {
    from: "mern.developers03@gmail.com",
    to: email,
    subject: "Invitation",
    html,
  };

  sendGrid(msgInfo);
  return sendEmail(msgInfo);
};

module.exports = sendInvitationEmail;
