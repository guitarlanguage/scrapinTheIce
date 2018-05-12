//what's this file for?
// getting all unsaved articles, scraping nhl.com articles, get articles from database,
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const db = require("./../../config/keys").mongoURI;
var axios = require("axios");
var cheerio = require("cheerio");

//load Article model
const Article = require("../../models/Article");
//load Note model
const Note = require("../../models/Note");

//@route                GET api/articles
//what this does...     gets all articles from the db
//@access               Public
router.get("/", function(req, res) {
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
    // If we were able to successfully scrape and save an Article, send a message to the client
    res.send("Scrape Complete");
    res.redirect("/");
  });
});

//@route                GET api/articles/unsaved
//what this does...     gets all unsaved articles
//@access               Public
router.get("/unsaved", function(req, res) {
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

//@route                GET api/articles/:id
//what this does...     Route for getting a specific Article by id, populate it with it's note
//@access               Public
router.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
router.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate(
        { _id: req.params.id },
        { note: dbNote._id },
        { new: true }
      );
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

router.get("/saved", function(req, res) {
  db.Article.find(
    {
      savedstatus: true
    },
    null,
    {
      sort: {
        _id: -1
      }
    },
    function(err, data) {
      if (data.length === 0) {
        res.render("starter", {
          message: "Please go to the home page and click 'browse'"
        });
      } else {
        res.render("saved", {
          articles: data
        });
      }
    }
  );
});

router.post("/save/:id", function(req, res) {
  db.Article.findById(req.params.id, function(err, data) {
    db.Article.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          savedstatus: true
        }
      },
      {
        new: true
      },
      function(err, data) {
        res.redirect("/");
      }
    );
  });
});

router.post("/delete/:id", function(req, res) {
  db.Article.findById(req.params.id, function(err, data) {
    db.Article.findByIdAndRemove(
      {
        _id: req.params.id
      },
      function(err, data) {
        res.redirect("/saved");
      }
    );
  });
});

module.exports = router;
