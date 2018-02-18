// express
var express = require("express");
var app = express();

// body-parser for getting POST variables
var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// handlebars as templating engine
var handlebars = require("express-handlebars");

// fs for filesystem stuff
var fs = require("fs");

// showdown for handlebars markdown output
var showdown = require("showdown");
var converter = new showdown.Converter();

// pg-promise for database (views, comments?)
var pgp = require("pg-promise")();
var db = pgp(process.env.DATABASE_URL + "?ssl=true");

// remove all possible dangerous characters
var safestring = function(input) {
  return input.toString().replace(/[\0\'\"\b\n\r\t\\\%\_\x08\x09\x1a]/g, ""); 
};

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
      var previewText = converter.makeHtml(this.markdown).replace(/\<[^\>]+\>/g, "");
      return previewText.slice(0, (previewText.length < 250) ? previewText.length : 250) + ((previewText.length < 250) ? "" : "&hellip;");
    },
    searchTitle: function(searchString) {
      searchString = searchString.replace(/\[[^\]]+\]/g, "");
      var search = new RegExp(searchString, "i");
      var result;
      if((result = search.exec(this.title)) !== null) {
        return this.title.slice(0, result.index) + "<span class='match'>" + result[0] + "</span>" + this.title.slice(result.index+result[0].length, this.title.length);
      }
      return this.title;
    },
    searchDate: function(searchString) {
      if(searchString === new Intl.DateTimeFormat("en-US", {month: "2-digit", day: "2-digit", year: "2-digit"}).format(new Date(this.date))) {
        return "<span class='match'>" + new Intl.DateTimeFormat("en-US", {month: "2-digit", day: "2-digit", year: "2-digit"}).format(new Date(this.date)) + "</span>";
      }
      return new Intl.DateTimeFormat("en-US", {month: "2-digit", day: "2-digit", year: "2-digit"}).format(new Date(this.date));
    },
    searchTag: function(searchString) {
      var searchTags = /\[([^\]]+)\]/g;
      var result;
      while((result = searchTags.exec(searchString)) !== null) {
        if(this.toString() === result[1]) {
          return "<span class='match'>" + this + "</span>";
        }
      }
      return this;
    },
    searchPreview: function(searchString) {
      var previewText = converter.makeHtml(this.markdown).replace(/\<[^\>]+\>/g, "");
      searchString = searchString.replace(/\[[^\]]+\]/g, "");
      var search = new RegExp(searchString, "i");
      var result;
      if((result = search.exec(previewText)) !== null) {
        return previewText.slice(
            (result.index-(125-result[0].length/2))<0
            ?0
            :(result.index-(125-result[0].length/2)), result.index)
          + "<span class='match'>" + result[0] + "</span>"
          + previewText.slice(result.index+result[0].length,
            (result.index+result[0].length+(125-result[0].length/2))>previewText.length
            ?previewText.length
            :result.index+result[0].length+(125-result[0].length/2));
      }
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
    },
    formatDate(isLong) {
      return isLong !== undefined
        ? new Intl.DateTimeFormat("en-US", {month: "2-digit", day: "2-digit", year: "2-digit"}).format(new Date(this.date))
        : new Intl.DateTimeFormat("en-US", {month: "2-digit", day: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", timeZoneName: "short"}).format(new Date(this.date));
    },
    formatCommentDate() {
      return new Intl.DateTimeFormat("en-US", {month: "2-digit", day: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit"}).format(new Date(this.date));
    },
    checkSelect: function(searchType) {
      return (this.searchType === searchType) ? "selected" : "";
    }
  },
  defaultLayout: "main"
}).engine);
app.set("view engine", "handlebars");

// get name, hitcount of all posts
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
          db.oneOrNone("select * from posts where title='" + safestring(postData.filename) + "'")
            .then(function(data) {
              postData.id = data.id;
              postData.comments = JSON.parse(data.comments);
              postData.hitcount = data.hitcount;
            })
            .catch(function(e) {
              if(e == "TypeError: Cannot read property 'hitcount' of null") {
                postData.hitcount = 0;
              } else {
                console.log("error with getting hitcounts: " + e);
              }
            });
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
for(var i = 0; i < quotes.length; i++) {
  quotes[i].source = converter.makeHtml(quotes[i].source);
}
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

      feedXml += "<item><title>" + post.title + "</title><link>https://everything-is-sheep.herokuapp.com/posts/" + post.filename + "</link><pubDate>" + post.date + "</pubDate><description>" + preview + "</description></item>";
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

// re-sorting function for search and postList pages
function postSort(postArray, sortType) {
  var sortFunction;
  switch(sortType) {
    case "views_asc":
      sortFunction = function(a, b) {
        return a.hitcount - b.hitcount;
      };
      break;
    case "views_desc":
      sortFunction = function(a, b) {
        return b.hitcount - a.hitcount;
      };
      break;
    case "title_asc":
      sortFunction = function(a, b) {
        return a.title.replace(/ /g, "").localeCompare(b.title.replace(/ /g, ""));
      };
      break;
    case "title_desc":
      sortFunction = function(a, b) {
        return b.title.replace(/ /g, "").localeCompare(a.title.replace(/ /g, ""));
      };
      break;
    case "date_asc":
      sortFunction = function(a, b) {
        return new Date(a.date) - new Date(b.date);
      };
      break;
    case "date_desc":
    default:
      sortFunction = function(a, b) {
        return new Date(b.date) - new Date(a.date);
      };
  }
  return postArray.slice(0).sort(sortFunction);
}

// handle routing (search)
// goes before url rewriting to avoid changing it
app.get("/search/:searchString", function(req, res) {
  var searchList = [];
  var searchString = req.params.searchString.toLowerCase();

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
    var tagsMatched = true;
    for(var tag of tags) {
      if(post.tags.indexOf(tag) === -1) {
        tagsMatched = false;
        break;
      }
    }
    var postContent = converter.makeHtml(post.markdown).replace(/\<[^\>]+\>/g, "").toLowerCase(); // remove all tags to get just text content
    if((tagsMatched && searchString !== "" && (post.title.toLowerCase().indexOf(searchString) >= 0 || postContent.indexOf(searchString) >= 0 || new Intl.DateTimeFormat("en-US", {month: "2-digit", day: "2-digit", year: "2-digit"}).format(new Date(post.date)) === searchString)) || (tagsMatched && searchString === "")) {
      searchList.push(post);
    }
  }
  searchList = postSort(searchList, req.query.sort);

  // narrow down search list
  var postNumber = searchList.length;
  var pageLength = 10;
  var searchPage = parseInt(req.query.page || 1);
  if(isNaN(searchPage) || searchPage < 1 || searchPage > searchList.length/pageLength+1) {
    searchPage = 1;
  }
  searchList = searchList.slice((searchPage-1)*pageLength, searchPage*pageLength);

  res.render("postList", {limitedPostList: limitedPostList, searchList: searchList, searchType: req.query.sort, searchString: req.params.searchString, postNumber: postNumber, quote: quote()});
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
app.get(["/", "/index.html"], function(req, res) {
  res.render("index", {limitedPostList: limitedPostList, quote: quote()});
});

// handle routing (postList)
app.get(["/posts", "/search"], function(req, res) {
  var slicedPostList = postSort(postList, req.query.sort);
  // narrow down post list
  var postNumber = postList.length;
  var pageLength = 10;
  var postPage = parseInt(req.query.page || 1);
  if(isNaN(postPage) || postPage < 1 || postPage > postList.length/pageLength+1) {
    postPage = 1;
  }
  slicedPostList = slicedPostList.slice((postPage-1)*pageLength, postPage*pageLength);
  res.render("postList", {limitedPostList: limitedPostList, postList: slicedPostList, postNumber: postNumber, quote: quote(), searchType: req.query.sort});
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

  // hitcount only stored in db
  db.oneOrNone("select hitcount from posts where title='" + safestring(postData.filename) + "'")
    .then(function(data) {

      // parsing cookies courtesy of https://stackoverflow.com/a/3409200/2397327
      function parseCookies(i){var o={},e=i.headers.cookie;return e&&e.split(";").forEach(function(i){var e=i.split("=");o[e.shift().trim()]=decodeURI(e.join("="))}),o}

      // if not in database create new post
      if(data === null) {
        postData.hitcount = 1;
        if(parseCookies(req).viewed === undefined || parseCookies(req).viewed.indexOf(postData.filename) === -1) {
          res.cookie("viewed", (parseCookies(req).viewed || "") + "+" + postData.filename, {maxAge: 15*60*1000, httpOnly: true});
        }
        db.none("insert into posts (title) values ('" + safestring(postData.filename) + "')")
          .catch(function(e) {
            console.log("error: inserting post into db: " + e);
          });
      } else {
        postData.hitcount = data.hitcount;
        if(parseCookies(req).viewed === undefined || parseCookies(req).viewed.indexOf(postData.filename) === -1) {
          res.cookie("viewed", (parseCookies(req).viewed || "") + "+" + postData.filename, {maxAge: 15*60*1000, httpOnly: true});
          postData.hitcount++;
          db.none("update posts set hitcount=" + safestring(postData.hitcount) + " where title='" + safestring(postData.filename) + "'")
            .catch(function(e) {
              console.log("error: update hitcount in db: " + e);
            });
        }
      }
      res.render("post", postData);
    })
    .catch(function(e) {
      console.log("error: get hitcount: " + e);
    });
});

// handle comments
// flag to prevent spamming; max one comment every five seconds
var recentComment = false;
app.post("/comment", function(req, res) {
  var comment = req.body.comment;
  var name = req.body.name;
  var postTitle = req.body.title;
  
  // error code 0: spam detection
  if(recentComment) {
    res.json({success: false, error: 1});
    return;
  }
  
  // error code 1: invalid name length
  if(name.length < 2 || name.length > 50) {
    res.json({success: false, error: 1})
    return;
  }
  
  // error code 2: invalid comment length
  if(comment.length < 10 || comment.length > 500) {
    res.json({success: false, error: 2});
    return;
  }
  
  // error code 3: illegal characters
  if(comment !== safestring(comment)) {
    res.json({success: false, error: 3});
    return;
  }
  
  // error code 4: post doesn't exist
  var post = postList.find(p => p.title == postTitle);
  if(post === undefined) {
    res.json({success: false, error: 4});
    return;
  }
  
  // success; add to database, set spam flag
  var commentJson = {
    name: name,
    comment: comment,
    date: new Date()
  };
  post.comments.push(commentJson);
  db.none(`update posts set comments='${JSON.stringify(post.comments)}' where id=${safestring(post.id)}`)
    .catch(function(e) {
      console.log("error: updating comments: " + e);
    });
  
  recentComment = true;
  setTimeout(() => recentComment = false, 5000);
  res.json({success: true});
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