const { connect } = require("mongoose");

const conn = async () => {
  try {
    await connect(process.env.MONGO_CNN);
    console.log("Base de datos conectada".bgYellow);
  } catch (error) {
    console.log(`Error db-conn: ${error.message}`.bgRed);
    process.exit(1);
  }
};

module.exports = { conn };
