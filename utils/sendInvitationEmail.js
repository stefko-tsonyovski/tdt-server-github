const sendEmail = require("./sendEmail");
const sendGrid = require("./sendgrid");

const sendInvitationEmail = async ({ from, email, origin }) => {
  const resetUrl = `${origin}/invitations`;
  const message = `<p>Welcome! We are happy to join us in our fantastic game TennisDreamTeam. 
    You can help the person that sent you this invitation by verifying it by clicking the following link:
    <a href=${resetUrl}>Verify Invitation</a></p>`;

  const msgInfo = {
    from: "mern.developers03@gmail.com",
    to: email,
    subject: "Invitation",
    html: `<h4>Join Invitation</h4>
      ${message}`,
  };

  sendGrid(msgInfo);
  return sendEmail(msgInfo);
};

module.exports = sendInvitationEmail;
