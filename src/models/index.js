const mongoose = require("mongoose");

const url = process.env.LOCAL_MONGO_DB;
mongoose.connect(url);

const con = mongoose.connection;
// mongoose.set("debug", true);

con.on("open", () => {
  console.log("connected to database");
});

con.on("error", (error) => {
  console.error("Error connecting to database:", error);
});

module.exports = con;
