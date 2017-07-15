$(function() {
  var menuButton = $("#menuButton");
  var sidebar = $("#sidebar");
  var searchBar = $("#searchBar");

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
    if($(this).width() > 1024 && sidebar.hasClass("expanded")) {
      sidebar.removeClass("expanded");
    }
  });
});
