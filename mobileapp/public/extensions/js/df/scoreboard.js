df.scoreboard = (function() {
  var $players = $(".players"),
      $home = [$players.find(".home1"), $players.find(".home2")],
      $visitors = [$players.find(".visitors1"), $players.find(".visitors2")],
      scoreSign = [],
      players = "";
  for (var i = 0; i < 190; ++i) {
    scoreSign.push("<span class=\"rly\"></span>");
  }

  df.subscribe("ready", function() {
    $("#scorehome, #scorevisitors").html(scoreSign.join(""));
  });

  df.subscribe("socket:message", function(msg) {
    if (msg.view !== "scoreboard") { return; }
    var goals = msg.game.goals.reduce(function(prev, curr) {prev[curr.scorer]+=curr.value; return prev; }, {home: 0, visitors: 0}),
        cplayers = msg.game.players.home.concat(msg.game.players.visitors).join(",");
        
    ["home", "visitors"].forEach(function(side) {
      localStorage.setItem("df.scoreboard.score."+side,goals[side]);
      $("#score" + side).attr("class", ["scorecard", ["neg nine", "neg eight", "neg seven", "neg six", "neg fiv", "neg four", "neg three", "neg two", "neg one", "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"][goals[side]+9] || "full"].join(" "));
    });

    $("#scoreboard .js_undo")[goals.home + goals.visitors > 0 ? "removeClass" : "addClass"]("hide js_disabled");

    if (players != cplayers) {
      if(typeof msg.game.players.home[0] === 'undefined' ){$home[0].text("");document.getElementById("canvas1").style.display = "none";}
      else{
        $home[0].text(msg.game.players.home[0]+": "+msg.playerStats.home[0]+"%");
        var lineChartData = {
          labels : ["","","","","","","","","","","",""],
          datasets : [
          {
            fillColor : "rgba(0,0,0,0)",
            strokeColor : msg.pending.playerColors.home[0],
            data : msg.homeScoreHistory[0]
          }]
        };
        document.getElementById("canvas1").style.display = "inline";
        var options = {scaleFontColor: msg.pending.playerColors.home[0]};
        var ctx = document.getElementById("canvas1").getContext("2d");
        window.myLine = new Chart(ctx).Line(lineChartData,options);
      }
      if(typeof msg.game.players.home[1] === 'undefined' ){$home[1].text("");document.getElementById("canvas2").style.display = "none";}
      else{
        $home[1].text(msg.game.players.home[1]+": "+msg.playerStats.home[1]+"%");
        var lineChartData = {
          labels : ["","","","","","","","","","","",""],
          datasets : [
          {
            fillColor : "rgba(0,0,0,0)",
            strokeColor : msg.pending.playerColors.home[1],
            data : msg.homeScoreHistory[1]
          }]
        };
        document.getElementById("canvas2").style.display = "inline";
        var options = {scaleFontColor: msg.pending.playerColors.home[1]};
        var ctx = document.getElementById("canvas2").getContext("2d");
        window.myLine = new Chart(ctx).Line(lineChartData,options);
      }
      if(typeof msg.game.players.visitors[0] === 'undefined' ){$visitors[0].text("");document.getElementById("canvas3").style.display = "none";}
      else{
        $visitors[0].text(msg.game.players.visitors[0]+": "+msg.playerStats.visitors[0]+"%");
        var lineChartData = {
          labels : ["","","","","","","","","","","",""],
          datasets : [
          {
            fillColor : "rgba(0,0,0,0)",
            strokeColor : msg.pending.playerColors.visitors[0],
            data : msg.visitorsScoreHistory[0]
          }]
        };
        document.getElementById("canvas3").style.display = "inline";
        var options = {scaleFontColor : msg.pending.playerColors.visitors[0]};
        var ctx = document.getElementById("canvas3").getContext("2d");
        window.myLine = new Chart(ctx).Line(lineChartData,options);
      }
      if(typeof msg.game.players.visitors[1] === 'undefined' ){$visitors[1].text("");document.getElementById("canvas4").style.display = "none";}
      else{
        $visitors[1].text(msg.game.players.visitors[1]+": "+msg.playerStats.visitors[1]+"%");
        var lineChartData = {
          labels : ["","","","","","","","","","","",""],
          datasets : [
          {
            fillColor : "rgba(0,0,0,0)",
            strokeColor : msg.pending.playerColors.visitors[1],
            data : msg.visitorsScoreHistory[1]
          }]
        };
        document.getElementById("canvas4").style.display = "inline";
        var options = {scaleFontColor: msg.pending.playerColors.visitors[1]};
        var ctx = document.getElementById("canvas4").getContext("2d");
        window.myLine = new Chart(ctx).Line(lineChartData,options);
      }
      
      var l = msg.game.players.home.length;
      if (l > 0) {
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

