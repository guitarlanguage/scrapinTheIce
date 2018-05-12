var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

// for localhost: 3000 or to push to build
var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Set Handlebars Section ---------------------------
var exphbs = require("express-handlebars");

app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main"
  })
);
app.set("view engine", "handlebars");

//----------------------------------------------------

// Use morgan logger for logging requests
app.use(logger("dev"));

// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());

// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// If deployed, use the deployed database. Otherwise use the local mongoscraper database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoscraper";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
  useMongoClient: true
});

// var routes = require('./routes');
// app.use(routes);

app.get("/", function(req, res) {
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

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
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

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
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

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
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
app.post("/articles/:id", function(req, res) {
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

app.get("/saved", function(req, res) {
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

app.post("/save/:id", function(req, res) {
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

app.post("/delete/:id", function(req, res) {
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

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});