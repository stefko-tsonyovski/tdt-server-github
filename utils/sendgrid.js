const sendGrid = require("@sendgrid/mail");

sendGrid.setApiKey(process.env.SENDGRID_API_KEY);

const sendByGrid = (msg) => {
  sendGrid
    .send(msg)
    .then((resp) => {
      console.log("Email sent\n", resp);
    })
    .catch((error) => {
      const {
        response: {
          body: { errors },
        },
      } = error;
      console.log(errors);
    });
};

module.exports = sendByGrid;
