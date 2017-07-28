$(function() {

  // make web app standalone (i.e., not open links in safari)
  // src: https://gist.github.com/irae/1042167 (condensed version)
  (function(a,b,c){if(c in b&&b[c]){var d,e=a.location,f=/^(a|html)$/i;a.addEventListener("click",function(a){d=a.target;while(!f.test(d.nodeName))d=d.parentNode;"href"in d&&(chref=d.href).replace(e.href,"").indexOf("#")&&(!/^[a-z\+\.\-]+:/i.test(chref)||chref.indexOf(e.protocol+"//"+e.host)===0)&&(a.preventDefault(),e.href=d.href)},!1)}})(document,window.navigator,"standalone");

  // mobile menu
  var menuButton = $("#menuButton");
  var sidebar = $("#sidebar");
  var searchBar = $("#searchBar");
  var sidebarSearchInput = $("#sidebarSearchInput");
  var clickableTags = $(".tag.clickable");

  menuButton.click(function() {
    sidebar.toggleClass("expanded");
  });

  searchBar.blur(function() {
    if($(this).val().trim() !== "") {
      window.location.href = "/search/" + $(this).val().trim();
    }
  });
  searchBar.keydown(function(event) {
    if(event.which === 13) {
      $(this).blur();
    } 
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
  
});
