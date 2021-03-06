var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");
var axios = require("axios");
var cheerio = require("cheerio");
const articles = require("./routes/api/articles");
const notes = require("./routes/api/notes");
// const index = require("./routes/api/index");

var app = express();

//body parser middleware
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // parse application/json

// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

//DB config
const db = require("./config/keys.js").mongoURI;

//connect to MongoDB
mongoose
  .connect(db)
  .then(() => console.log(`MongoDB connected`))
  .catch(err => console.log(err));

// Set Handlebars Section ---------------------------
var exphbs = require("express-handlebars");

app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main"
  })
);
app.set("view engine", "handlebars");
//----------handlebars-----------------------

// Use morgan logger for logging requests
app.use(logger("dev"));

// Use Routes
app.use("/api/articles", articles);
app.use("/api/notes", notes);
// app.use("/api/index", index);

// for localhost: 3000 or to push to build
var PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
