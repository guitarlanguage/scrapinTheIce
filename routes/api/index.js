const articles = require("./routes/api/articles");
const notes = require("./routes/api/notes");
var router = require("express").Router();
const db = require("./../../config/keys").mongoURI;
var axios = require("axios");
var cheerio = require("cheerio");

router.get("/", function(req, res) {
  res.render("home");
});

module.exports = router;
