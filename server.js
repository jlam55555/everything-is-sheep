// express
var express = require("express");
var app = express();

// handlebars as templating engine
var handlebars = require("express-handlebars");

// fs for filesystem stuff
var fs = require("fs");

// showdown for handlebars markdown output
var showdown = require("showdown");
var converter = new showdown.Converter();

// set view engine to handlebars
app.engine("handlebars", handlebars.create({
  helpers: {
    formatPost: function() {
      return new showdown.Converter().makeHtml(this.markdown);
    },
    preview: function() {
      if(this.markdown.length < 50) {
        return converter.makeHtml(this.markdown);
      } else {
        return converter.makeHtml(this.markdown.slice(0, 50)) + "&hellip;";
      }
    }
  },
  defaultLayout: "main"
}).engine);
app.set("view engine", "handlebars");

// get name of all posts
var postList = [];
fs.readdir("./posts", function(error, posts) {
  for(var post of posts) {
    if(post.slice(-5) === ".json") {
      (function() {
        var _post = post;
        var postData = require("./posts/" + post);
        fs.readFile("./posts/" + _post.slice(0, -5) + ".md", "utf-8", function(error, markdown) {
          if(error) {
            return console.log(error);
          }
          postData.filename = _post.slice(0, -5);
          postData.markdown = markdown;
          postList.push(postData);

          postList.sort(function(post1, post2) {
            return new Date(post2.date) - new Date(post1.date);
          });
        });
      })();
    }
  }
});

// get name of all authors
var authorList = [];
fs.readdir("./authors", function(error, authors) {
  for(var author of authors) {
    var authorData = require("./authors/" + author);
    authorData.filename = author.slice(0, -5);
    authorList.push(authorData);
  }
});

// handle routing (index)
app.get("/", function(req, res) {
  res.render("index", {postList: postList, authorList: authorList});
});

// handle routing (posts)
app.get("/posts/*", function(req, res) {
  var postData = postList.find(function(post) {
    return req.url.replace(/\%20| /g, "-").slice(7) == post.filename;
  }) || {};
  postData.postList = postList;
  postData.authorList = authorList;
  res.render("post", postData);
});

// handle routing (authors)
app.get("/authors/*", function(req, res) {
  var authorData = authorList.find(function(author) {
    return req.url.replace(/\%20| /g, "-").toLowerCase().slice(9) == author.filename;
  }) || {};
  authorData.postList = postList;
  authorData.authorList = authorList;
  var authoredPosts = []
  for(var post of postList) {
    if(post.author == authorData.name) {
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
