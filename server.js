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
    formatDescriptionNoLinks: function() {
      return converter.makeHtml(this.description).replace(/\<\/?a[^\>]*\>/g, "");
    },
    formatDescription: function() {
      return converter.makeHtml(this.description);
    },
    formatPost: function() {
      return converter.makeHtml(this.markdown);
    },
    preview: function() {
      if(this.markdown.length < 50) {
        return converter.makeHtml(this.markdown);
      } else {
        return converter.makeHtml(this.markdown.slice(0, 50).replace(/([0-9a-zA-Z])([^0-9a-zA-Z]*)$/, "$1&hellip;$2"));
      }
    }
  },
  defaultLayout: "main"
}).engine);
app.set("view engine", "handlebars");

// get name of all posts
var postList = [];
var postsCompleted = 0;
var totalPosts;
fs.readdir("./posts", function(error, posts) {
  totalPosts = posts.length;
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
          postsCompleted++;
        });
      })();
    }
  }
});

// get name of all authors
var authorList = [];
var authorsCompleted = 0;
var totalAuthors;
fs.readdir("./authors", function(error, authors) {
  totalAuthors = authors.length;
  for(var author of authors) {
    if(author.slice(-5) === ".json") {
      (function() {
        var _author = author;
        var authorData = require("./authors/" + _author);
        fs.readFile("./authors/" + _author.slice(0, -5) + ".md", "utf-8", function(error, markdown) {
          if(error) {
            return console.log(error);
          }
          authorData.filename = _author.slice(0, -5);
          authorData.description = markdown;
          authorList.push(authorData);
          authorsCompleted++;
        });
      })();
    }
  }
});

// do stuff with completed lists of posts and authors
var t = setInterval(function() {
  console.log("Checking if get posts and get authors completed...");

  // when all posts are completed
  if(postsCompleted === totalPosts/2 && authorsCompleted === totalAuthors/2) {

    // sort posts by date
    postList.sort(function(post1, post2) {
      return new Date(post2.date) - new Date(post1.date);
    });

    // add author object to posts    
    for(var i = 0; i < postList.length; i++) {
      postList[i].author = authorList.find(function(author) {
        return author.name === postList[i].author;
      });
    }

    // end setInterval()
    console.log("Get posts and get authors completed.");
    clearInterval(t);
  }
}, 50);

// url rewriting middleware
app.use(function(req, res, next) {
  if(req.url !== req.url.toLowerCase().replace(/ |%20/g, "-")) {
    res.redirect(req.url.toLowerCase().replace(/ |%20/g, "-"));
  } else {
    next();
  }
});

// handle routing (index)
app.get("/", function(req, res) {
  res.render("index", {postList: postList, authorList: authorList});
});

// handle routing (postList)
app.get("/posts", function(req, res) {
  res.render("postList", {postList: postList, authorList: authorList});
});

// handle routing (authorList)
app.get("/authors", function(req, res) {
  res.render("authorList", {postList: postList, authorList: authorList});
});

// handle routing (posts)
app.get("/posts/*", function(req, res, next) {
  var postData = postList.find(function(post) {
    return req.url.slice(7) === post.filename;
  });
  if(postData === undefined) {
    next();
    return;
  }
  postData.postList = postList;
  postData.authorList = authorList;
  res.render("post", postData);
});

// handle routing (authors)
app.get("/authors/*", function(req, res, next) {
  var authorData = authorList.find(function(author) {
    return req.url.slice(9) === author.filename;
  });
  if(authorData === undefined) {
    next();
    return;
  }
  authorData.postList = postList;
  authorData.authorList = authorList;
  var authoredPosts = []
  for(var post of postList) {
    if(post.author.name == authorData.name) {
      authoredPosts.push(post);
    }
  }
  authorData.authoredPosts = authoredPosts;
  res.render("author", authorData);
});

// handle routing (resources)
app.use("/res", express.static("res"));

// handle routing (404)
app.use("/*", function(req, res) {
  res.render("404", {url: req.originalUrl, postList: postList, authorList: authorList});
});

// listen on port
app.listen(process.env.PORT || 5000);
