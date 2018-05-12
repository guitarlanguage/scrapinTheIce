//what's this file for?
// Notes model populating notes in the articles
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

module.exports = router;
