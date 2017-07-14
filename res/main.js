$(function() {
  var menuButton = $("#menuButton");
  var sidebar = $("#sidebar");

  menuButton.click(function() {
    sidebar.toggleClass("expanded");
  });

  $(window).resize(function() {
    if($(this).width() > 1024 && sidebar.hasClass("expanded")) {
      sidebar.removeClass("expanded");
    }
  });
});
