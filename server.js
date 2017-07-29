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
    sIfNotOne: function() {
      return (this.postNumber === 1) ? "" : "s";
    },
    formatDescription: function() {
      return converter.makeHtml(this.description);
    },
    formatPost: function() {
      return converter.makeHtml(this.markdown);
    },
    preview: function() {
      let previewText = converter.makeHtml(this.markdown).replace(/\<[^\>]+\>/g, "");
      return previewText.slice(0, (previewText.length < 250) ? previewText.length : 250) + ((previewText.length < 250) ? "" : "&hellip;");
    },
    previewDescription: function() {
      let previewText = converter.makeHtml(this.description).replace(/\<[^\>]+\>/g, "");
      return previewText.slice(0, (previewText.length < 250) ? previewText.length : 250) + ((previewText.length < 250) ? "" : "&hellip;");
    },
    formatSearchString: function() {
      var result;
      var tags = [];
      var search = this.searchString;
      while((result = /\[[a-z\-]+\]/g.exec(search)) !== null) {
        var index = result.index;
        var match = result[0];
        tags.push(search.slice(index+1, index+match.length-1));
        search = search.slice(0, index) + search.slice(index+match.length);
      }
      search = search.trim();
      for(var tag of tags) {
        search += " <span class='tag'>" + tag + "</span>";
      }
      return search;
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

// get quotes
var quotes = require("./quotes.json");
var quote = function() {
  return quotes[Math.floor(Math.random()*quotes.length)];
};

// do stuff with completed lists of posts and authors
var limitedPostList = [];
var t = setInterval(function() {
  console.log("Checking if get posts and get authors completed...");

  // when all posts are completed
  if(postsCompleted === totalPosts/2 && authorsCompleted === totalAuthors/2) {

    // sort posts by date
    postList.sort(function(post1, post2) {
      return new Date(post2.date) - new Date(post1.date);
    });

    // set limitedPostList to last five posts
    limitedPostList = postList.slice(0, 5);

    // add author object to posts    
    for(var i = 0; i < postList.length; i++) {
      postList[i].author = authorList.find(function(author) {
        return author.name === postList[i].author;
      });
    }
    
    // create RSS feed
    let feedXml = "<?xml version='1.0' encoding='UTF-8' ?><rss version='2.0'><channel><title>Everything is Sheep</title><link>https://everything-is-sheep.herokuapp.com</link><description>A playground for free-form teenage writing</description>";
    let truncatedList = postList.slice(0, (postList.length < 20) ? postList.length : 20);
    for(let post of truncatedList) {

      // really convoluted way to get RFC2822-formatted dates
      let formatter = new Intl.DateTimeFormat("en-us", {weekday: "short", day: "numeric", month: "short", year: "numeric"});
      let formattedDate = formatter.format(new Date(post.date));
      formattedDate = formattedDate.slice(0, 5) + formattedDate.slice(9, 11) + formattedDate.slice(4, 9) + formattedDate.slice(13) + " 00:00:00 +0000";

      // preview as RSS description
      let preview = converter.makeHtml(post.markdown);
      if(preview.length >= 100) {
        preview = converter.makeHtml(preview.replace(/\<[^\>]+\>/g, "").slice(0, 100) + "&hellip;");
      }
      // safestring code courtesy of https://stackoverflow.com/a/12034334/2397327
      var entityMap={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'};
      preview = preview.replace(/[&<>"'`=\/]/g, function(s) {
        return entityMap[s];
      });

      feedXml += "<item><title>" + post.title + "</title><link>https://everything-is-sheep.herokuapp.com/posts/" + post.filename + "</link><pubDate>" + formattedDate + "</pubDate><description>" + preview + "</description></item>";
    }
    feedXml += "</channel></rss>";
    fs.writeFile("feed.xml", feedXml, function(error) {
      if(error) {
        return console.log(error);
      }
      console.log("RSS feed written to /feed.xml");
    });

    // end setInterval()
    console.log("Get posts and get authors completed.");
    clearInterval(t);
  }
}, 50);

// handle routing (search)
// goes before url rewriting to avoid changing it
app.get("/search/*", function(req, res) {
  var searchList = [];
  var searchString = req.url.slice(8).toLowerCase().replace(/%20/g, " ");

  // filter out tags
  var result;
  var tags = [];
  while((result = /\[[a-z\-]+\]/g.exec(searchString)) !== null) {
    var index = result.index;
    var match = result[0];
    tags.push(searchString.slice(index+1, index+match.length-1));
    searchString = searchString.slice(0, index) + searchString.slice(index+match.length);
  }
  searchString = searchString.trim();
  for(post of postList) {
    var postContent = post.markdown.replace(/\<[^\>]+\>/g, "").toLowerCase(); // remove all tags to get just text content
    if(searchString !== "" && (post.title.toLowerCase().indexOf(searchString) >= 0 || postContent.indexOf(searchString) >= 0 || post.date === searchString)) {
      searchList.push(post);
      continue;
    }
    for(var tag of tags) {
      if(post.tags.indexOf(tag) >= 0) {
        searchList.push(post);
        break;
      }
    }
  }
  res.render("postList", {limitedPostList: limitedPostList, searchList: searchList, searchString: req.url.slice(8).replace(/%20/g, " "), postNumber: searchList.length, quote: quote()});
});

// url rewriting middleware
app.use(function(req, res, next) {
  if(req.url !== req.url.toLowerCase().replace(/ |%20/g, "-")) {
    res.redirect(req.url.toLowerCase().replace(/ |%20/g, "-"));
  } else {
    next();
  }
});

// handle routing (feed.xml)
app.get("/feed.xml", function(req, res) {
  res.sendFile(__dirname + "/feed.xml");
});

// handle routing (index)
app.get("/", function(req, res) {
  res.render("index", {limitedPostList: limitedPostList, quote: quote()});
});

// handle routing (postList)
app.get(["/posts", "/search"], function(req, res) {
  res.render("postList", {limitedPostList: limitedPostList, postList: postList, quote: quote()});
});

// handle routing (authorList)
app.get("/authors", function(req, res) {
  res.render("authorList", {limitedPostList: limitedPostList, authorList: authorList, quote: quote()});
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
  postData.limitedPostList = limitedPostList;
  postData.quote = quote();
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
  authorData.limitedPostList = limitedPostList;
  var authoredPosts = []
  for(var post of postList) {
    if(post.author.name == authorData.name) {
      authoredPosts.push(post);
    }
  }
  authorData.authoredPosts = authoredPosts;
  authorData.quote = quote();
  res.render("author", authorData);
});

// handle routing (resources)
app.use("/res", express.static("res"));

// handle routing (404)
app.use("/*", function(req, res) {
  res.render("404", {url: req.originalUrl, limitedPostList: limitedPostList, quote: quote()});
});

// listen on port
app.listen(process.env.PORT || 5000);
