const articles = require("./routes/api/articles");
const notes = require("./routes/api/Notes");

var router = require("express").Router();

router.get("/", function(req, res) {
  res.render("home");
});

module.exports = router;
