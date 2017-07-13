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
  for(var post of posts) {
    if(post.slice(-5) === ".json") {
      var postData = require("./posts/" + post);
      postList.push({filename: post.slice(0, -5), title: postData.title, data: postData});
    }
  }
  postList.sort(function(post1, post2) {
    return new Date(post2.data.date) - new Date(post1.data.date);
  });
});

// get name of all authors
var authorList = [];
fs.readdir("./authors", function(error, authors) {
  for(var author of authors) {
    var authorData = require("./authors/" + author);
    authorList.push({filename: author.slice(0, -5), name: authorData.name});
  }
});

// handle routing (index)
app.get("/", function(req, res) {
  res.render("index", {postList: postList, authorList: authorList});
});

// handle routing (posts)
app.get("/posts/*", function(req, res) {
  var postData = require("." + req.url.replace(/\%20| /g, "-") + ".json");
  postData.postList = postList;
  postData.authorList = authorList;
  
  fs.readFile("./" + req.url + ".md", "utf-8", function(error, markdown) {
    if(error) {
      return console.log(error);
    }
    postData.markdown = markdown.replace(/\n/g, "\\n");
    res.render("post", postData);
  });
});

// handle routing (authors)
app.get("/authors/*", function(req, res) {
  var authorData = require("." + req.url.replace(/\%20| /g, "-").toLowerCase() + ".json");
  authorData.postList = postList;
  authorData.authorList = authorList;
  var authoredPosts = []
  for(var post of postList) {
    if(post.data.author == authorData.name) {
      authoredPosts.push(post);
    }
  }
  authorData.authoredPosts = authoredPosts;
  res.render("author", authorData);
});

// handle routing (resources)
app.use("/res", express.static("res"));

// listen on port
app.listen(process.env.PORT || 5000);
