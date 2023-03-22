const sendEmail = require("./sendEmail");
const sendGrid = require("./sendgrid");
const fs = require("fs");

const sendInvitationEmail = async ({ email, origin }) => {
  const resetUrl = `${origin}/invitations`;
  const html = fs.readFileSync("./invitation-email-template.html").toString();
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
