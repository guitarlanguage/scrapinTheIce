//what's this file for?
// getting all unsaved articles, scraping nhl.com articles, get articles from databse,
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const router = express.Router();

//load Article model
const Article = require("../../models/Article");

//@route                GET api/articles
//what this does...     gets all unsaved articles
//@access               Public
router.get("/", function(req, res) {
  //find unsaved articles
  db.Article.find({ isSaved: false }, null, { sort: { _id: -1 } }, function(
    err,
    docs
  ) {
    if (data === 0) {
      res.render("starter", {
        message: "Please click new articles for new articles"
      });
    } else {
      res.render("index", {
        articles: data
      });
    }
  });
});

//@route                GET api/articles/scrape
//what this does...     Scrapes all nhl.com articles
//@access               Public
router.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  axios.get("https://www.nhl.com/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    console.log(response);

    // Now, we grab every headline-link within a h4, and do the following:
    $("li.mixed-feed__item mixed-feed__item--article").each(function(
      i,
      element
    ) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children()
        .children("h4")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

      result.summary = $(this)
        .children()
        .children("h5")
        .text();
      // .pretty();

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });
    });

    // Route for getting all Articles from the db
    router.get("/articles", function(req, res) {
      // Grab every document in the Articles collection
      db.Article.find({})
        .then(function(dbArticle) {
          // If we were able to successfully find Articles, send them back to the client
          res.json(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          res.json(err);
        });
    });

    // If we were able to successfully scrape and save an Article, send a message to the client
    res.send("Scrape Complete");
    res.redirect("/");
  });
});

//@route                GET api/articles
//what this does...     gets all articles from the db
//@access               Public
// Route for getting all Articles from the db
router.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});
