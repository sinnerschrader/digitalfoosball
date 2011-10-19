df.scoreboard = (function() {
  var $players = $(".players"),
      $home = [$players.find(".home1"), $players.find(".home2")],
      $visitors = [$players.find(".visitors1"), $players.find(".visitors2")],
      scoreSign = [],
      players = "";

  for (var i = 0; i < 45; ++i) {
    scoreSign.push("<span class=\"rly\"></span>");
  }

  df.subscribe("ready", function() {
    $("#scorehome, #scorevisitors").html(scoreSign.join(""));
  });

  df.subscribe("socket:message", function(msg) {
    if (msg.view !== "scoreboard") { return; }

    var goals = msg.game.goals.reduce(function(prev, curr) {++prev[curr.scorer]; return prev; }, {home: 0, visitors: 0}),
        cplayers = msg.game.players.home.concat(msg.game.players.visitors).join(",");

    ["home", "visitors"].forEach(function(side) {
      localStorage.setItem("df.scoreboard.score."+side,goals[side]);
      $("#score" + side).attr("class", ["scorecard", ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"][goals[side]] || "full"].join(" "));
    });

    $("#scoreboard .js_undo")[goals.home + goals.visitors > 0 ? "removeClass" : "addClass"]("hide js_disabled");

    if (players != cplayers) {
      var l = msg.game.players.home.length;
      if (l > 0) {
        for (var i = 0; i < l; ++i) {
          $home[i].text(msg.game.players.home[i]);
          $visitors[i].text(msg.game.players.visitors[i]);
        }
        if (l == 1) {
         $players.addClass("opponents2");
        } else {
         $players.removeClass("opponents2");
        }
        $(".players").addClass("show");
      } else {
        $(".players").removeClass("show");
      }
      players = cplayers;
    }
  });

  return {};
})();

