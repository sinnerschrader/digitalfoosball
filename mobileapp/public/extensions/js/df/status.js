df.status = (function() {
  var lastPing = 0;
  var homePlayers = [];
  var visitorsPlayers = [];
  df.subscribe("socket:message", function(msg) {

    if(msg.changeMessage == "start game"){
      homePlayers = msg.game.players.home;
      visitorsPlayers = msg.game.players.visitors;
      $(".homeWinPercent").text(msg.teamStats[0]+"%");
      $(".visitorsWinPercent").text(msg.teamStats[1]+"%");
      $(".homeMatchupWins").text(msg.matchupStats[0]+"/"+(parseInt(msg.matchupStats[0])+parseInt(msg.matchupStats[1])));
      $(".visitorsMatchupWins").text(msg.matchupStats[1]+"/"+(parseInt(msg.matchupStats[1])+parseInt(msg.matchupStats[0])));
      $(".homeOdds").text(msg.odds+"%");
      $(".visitorsOdds").text(100 - parseInt(msg.odds)+"%");


      //not actually calculating, this is just setup for later
      $("#homeStats1").text("Calculating...");
      $("#homeStats2").text("Calculating...");
      $("#visitorsStats1").text("Calculating...");
      $("#visitorsStats2").text("Calculating...");
    }
    if(msg.changeMessage == "game aborted"){
        displayTempMessage("Game aborted","White",5000);

      $(".homeWinPercent").text("");
      $(".visitorsWinPercent").text("");
      $(".homeMatchupWins").text("");
      $(".visitorsMatchupWins").text("");
      $(".homeOdds").text("");
      $(".visitorsOdds").text("");
    }
    var ping = (msg.dogkick ? msg.dogkick : 0);
    if(ping>0 && ping-lastPing>60000){
      displayTempMessage("Raspberry Started","Green",5000);
    }
    lastPing = ping;

    if(msg.changeMessage == "visitors scored"){
      displayTempMessage("Black Scored!!","White",5000);
    }
    if(msg.changeMessage == "visitors scored game over"){
      displayTempMessage("Black Scored!!","White",5000);
      displayTempMessage("Game Over: Black Wins","White",5000);
      $(".gameStatsWrapper").show();
      $(".homeDisplay").hide();
      setTimeout(function(){$(".gameStatsWrapper").hide();$(".homeDisplay").show();},30000);
    }   
    if (msg.changeMessage == "home scored"){
      displayTempMessage("Yellow Scored!!","Yellow",5000);
    }
    if(msg.changeMessage == "home scored game over"){
      displayTempMessage("Yellow Scored!!","Yellow",5000);
      displayTempMessage("Game Over: Yellow Wins","Yellow",5000);
      $(".gameStatsWrapper").show();
      $(".homeDisplay").hide();
      setTimeout(function(){$(".gameStatsWrapper").hide();$(".homeDisplay").show();},30000);
    }

    if(msg.changeMessage == "penalty on visitors"){
      displayTempMessage("Penalty on Black","Red",5000);
    }
    if(msg.changeMessage == "penalty on home"){
      displayTempMessage("Penalty on Yellow","Red",5000);
    }
    if(msg.pending.msg == "gameOver"){
      $("#homeStats1").text(homePlayers[0]+"'s score change: "+msg.pending.homeScoreHistory[0]);
      $("#homeStats2").text(homePlayers[1]+"'s score change: "+msg.pending.homeScoreHistory[1]);
      $("#visitorsStats1").text(visitorsPlayers[0]+"'s score change: "+msg.pending.visitorsScoreHistory[0]);
      $("#visitorsStats2").text(visitorsPlayers[1]+"'s score change: "+msg.pending.visitorsScoreHistory[1]);
    }
  });

  return {};
})();
function displayTempMessage(message,color,time){
      var rand = Math.round(Math.random()*100000);
      $("#tempMessages").show();
      $("#tempMessages").append("<div id = tempDiv"+rand+" style='height:50px;text-align:center;'><font size='50' color = "+color+" text-align = center>"+message+"</font></div>");
      setTimeout(function(){$('#tempDiv'+rand).remove();if($('#tempMessages').is(':empty')){$("#tempMessages").hide();}},time);
}
