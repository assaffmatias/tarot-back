const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

module.exports = {
  generateJWT: (uid) => jwt.sign({ uid }, process.env.SECRET_KEY),
  googleVerify: async (token) => {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    return payload;
  },
};
