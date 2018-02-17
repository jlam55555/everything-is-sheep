$(function() {

  // make web app standalone (i.e., not open links in safari)
  // src: https://gist.github.com/irae/1042167 (condensed version)
  (function(a,b,c){if(c in b&&b[c]){var d,e=a.location,f=/^(a|html)$/i;a.addEventListener("click",function(a){d=a.target;while(!f.test(d.nodeName))d=d.parentNode;"href"in d&&(chref=d.href).replace(e.href,"").indexOf("#")&&(!/^[a-z\+\.\-]+:/i.test(chref)||chref.indexOf(e.protocol+"//"+e.host)===0)&&(a.preventDefault(),e.href=d.href)},!1)}})(document,window.navigator,"standalone");

  var menuButton = $("#menuButton");
  var sidebar = $("#sidebar");
  var searchBar = $("#searchBar");
  var sidebarSearchInput = $("#sidebarSearchInput");
  var clickableTags = $(".tag.clickable");
  var facebookButton = $(".fa-facebook-official");
  var twitterButton = $(".fa-twitter");
  var googlePlusButton = $(".fa-google-plus");
  var mainSearchHint = $("#mainSearchHint");
  var searchType = $("#searchType");
  var content = $("#content");
  var currentPage = $(".currentPage");
  var pageCount = $(".pageCount");
  var postNumber = $("#postNumber");
  var commentName = $("#commentName");
  var commentText = $("#commentText");
  var submitComment = $("#submitComment");
  var postTitle = $("#postTitle");

  menuButton.click(function() {
    sidebar.toggleClass("expanded");
  });

  searchBar.focus(function() {
    mainSearchHint.addClass("activated");
  });
  searchType.focus(function() {
    mainSearchHint.addClass("activated");
  });
  searchBar.blur(function() {
    mainSearchHint.removeClass("activated");
  });
  searchType.blur(function() {
    mainSearchHint.removeClass("activated");
  });
  searchBar.keydown(function(event) {
    if(event.which === 13 && $(this).val().trim() !== "") {
      window.location.href = "/search/" + $(this).val().trim().replace(/\//g, "%2f") + "?sort=" + searchType.val();
    }
  });
  searchType.change(function() {
    window.location.href = "/search/" + searchBar.val().trim().replace(/\//g, "%2F") + "?sort=" + $(this).val();
  });

  $(window).resize(function() {
    if($(this).width() >= 1024 && sidebar.hasClass("expanded")) {
      sidebar.removeClass("expanded");
    }

    // add extra top section on web app
    if($(this).width() < 1024 && ("standalone" in navigator) && navigator["standalone"]) {
      $("#content").addClass("webApp");
      $("#sidebar").addClass("webApp"); 
    }
    // remove extra top section if width changes to greater than 1024
    if($("#content").hasClass("webApp") && $(this).width() >= 1024) {
      $("#content").removeClass("webApp");
      $("#sidebar").removeClass("webApp");
    }

  }).resize();

  // sidebar search functionality
  sidebarSearchInput.keyup(function(event) {
    if(event.which === 13 && $(this).val().trim() !== "") {
      window.location.href = "/search/" + $(this).val().trim();
    }
  });

  // clickable post tags
  clickableTags.each(function() {
    $(this).attr({title: "Search posts by tag [" + $(this).text() + "]"});
  });
  clickableTags.click(function() {
    window.location.href = "/search/[" + $(this).text() + "]";
  });

  // edit share buttons
  var url = window.location.href;
  var notPost = false;
  if(!/\/posts\/.+/.exec(url)) {
    url = "https://everything-is-sheep.herokuapp.com";
    notPost = true;
  }
  facebookButton.parent().attr({href: "https://www.facebook.com/sharer/sharer.php?u=" + url});
  twitterButton.parent().attr({href: notPost
    ? "https://twitter.com/home?status=Check%20out%20the%20blog%20Everything%20is%20Sheep,%20a%20playground%20for%20free-form%20teenage%20writing."
    : "https://twitter.com/home?status=To%20read%3A%20%22" + $("#postTitle").text() + "%22%20(" + url + ")%20from%20Everything%20is%20Sheep"
    });
  googlePlusButton.parent().attr({href: "https://plus.google.com/share?url=" + url});

  if(window.location.href.indexOf("#") >= 0) {
    content.scrollTop($("#" + window.location.href.split("#")[1]).offset().top);
  }

  // edit page for postList navigation count
  if(pageCount) {
    var pageCountNumber = Math.ceil(postNumber.text() / 10);
    pageCount.text(pageCountNumber);
    for(var i = 0; i < pageCountNumber; i++) {
      currentPage.append($("<option/>").text(i+1).val(i+1));
    }
    var currentPageNumber = (/page=(\d+)/.exec(window.location.href) || {1: 1})[1];
    currentPage.val(currentPageNumber);
    currentPage.change(function() {
      if(window.location.href.indexOf("page=") > 0) {
        window.location.href = window.location.href.replace(/(page=)\d+/, "$1" + $(this).val());
      } else {
        window.location.href = window.location.href + (window.location.href.indexOf("?") > 0 ? "&" : "?") + "page=" + $(this).val();
      }
    });
  }
  
  // submit comment
  submitComment.click(function() {
    $.post("/comment", { comment: commentText.val(), name: commentName.val(), title: postTitle.text() }, function(data) {
      console.log(data);
    })
  });

});
