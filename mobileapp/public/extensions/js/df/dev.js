df.dev = (function() {
  $(window).bind("keyup", function(e) {
    if ($(".page.active form").length === 0) {
      if (e.keyCode === 72) {
        $.post("/events/goals/home")
        //console.log("Goal HOME");
      } else if (e.keyCode === 71) {
        $.post("/events/goals/visitors")
        //console.log("Goal VISITORS");
      } else if (e.keyCode ===  65) {
        $(".js_abortgame").trigger("click");
        //console.log("Abort game");
      } else if (e.keyCode === 78) {
        $(".js_newmatch").trigger("click");
        //console.log("Start quickgame")
      } else if (e.keyCode === 50) {
        /*$(".js_login[data-opponents=2]").trigger("click");
        console.log("Login 2");*/
      } else if (e.keyCode === 52) {
        /*$(".js_login[data-opponents=4]").trigger("click");
        console.log("Login 4");*/
      } else if (e.keyCode === 85) {
        $.post("/events/undo/home")
        //console.log("Goal HOME");
      }
    }
  });

  return {};
})();

