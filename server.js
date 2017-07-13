// express
var express = require("express");
var app = express();

// handlebars as templating engine
var handlebars = require("express-handlebars");

// fs for filesystem stuff
var fs = require("fs");

// set view engine to handlebars
app.engine("handlebars", handlebars({defaultLayout: "main"}));
app.set("view engine", "handlebars");

// get name of all posts
var postList = [];
fs.readdir("./posts", function(error, posts) {
  for(var i = 0; i < posts.length; i++) {
    if(posts[i].slice(-5) === ".json") {
      postList.push({filename: posts[i].slice(0, -5), title: require("./posts/" + posts[i]).title});
    }
  }
});

// handle routing (index)
app.get("/", function(req, res) {
  res.render("index", {postList: postList});
});

// handle routing (posts)
app.get("/posts/*", function(req, res) {
  var postData = require("./" + req.url + ".json");
  fs.readFile("./" + req.url + ".md", "utf-8", function(error, markdown) {
    if(error) {
      return console.log(error);
    }
    postData["markdown"] = markdown.replace(/\n/g, "\\n");
    res.render("post", postData);
  });
});

// listen on port
app.listen(process.env.PORT || 5000);
