const sendEmail = require("./sendEmail");
const sendGrid = require("./sendgrid");
const fs = require("fs");
const path = require("path");

const sendInvitationEmail = async ({ email, origin }) => {
  const resetUrl = `${origin}`;
  const message = `<p>Welcome! We are happy to join us in our fantasy game Tennis Dream Team.
    You can help the person that sent you this invitation by downloading and registering on the app. Following link is to the game on Google Play Store:
    <a href=${resetUrl}>Check out the app on Google Play Store</a></p>`;

  const msgInfo = {
    from: "mern.developers03@gmail.com",
    to: email,
    subject: "Invitation",
    html: `<h3> You were invited to join fantasy game Tennis Dream Team</h3>
    ${message}`,
  };

  sendGrid(msgInfo);
  return sendEmail(msgInfo);
};

module.exports = sendInvitationEmail;
