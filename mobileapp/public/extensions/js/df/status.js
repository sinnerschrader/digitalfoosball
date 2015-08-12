df.status = (function() {
  var lastPing = 0;
  var homePlayers = [];
  var visitorsPlayers = [];
  var saveHomeScoreHistory = [];
  var saveVisitorsScoreHistory = [];
  var myPlayerColors = {
    home:[],
    visitors:[]
  };
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

      $("#home1Name").text(msg.game.players.home[0]);
      $("#home2Name").text(msg.game.players.home[1]);
      $("#visitors1Name").text(msg.game.players.visitors[0]);
      $("#visitors2Name").text(msg.game.players.visitors[1]);

      myPlayerColors = msg.playerColors;
      document.getElementById("home1Row").style.color = myPlayerColors.home[0];
      document.getElementById("home2Row").style.color = myPlayerColors.home[1];
      document.getElementById("visitors1Row").style.color = myPlayerColors.visitors[0];
      document.getElementById("visitors2Row").style.color = myPlayerColors.visitors[1];

      saveHomeScoreHistory = msg.homeScoreHistory;
      saveVisitorsScoreHistory = msg.visitorsScoreHistory;

      $("#home1Prev").text(saveHomeScoreHistory[0][saveHomeScoreHistory[0].length-1]);
      $("#home2Prev").text(saveHomeScoreHistory[1][saveHomeScoreHistory[1].length-1]);
      $("#visitors1Prev").text(saveVisitorsScoreHistory[0][saveVisitorsScoreHistory[0].length-1]);
      $("#visitors2Prev").text(saveVisitorsScoreHistory[1][saveVisitorsScoreHistory[1].length-1]);
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
      $("#allPlayersGraph").show();
      $(".gameStatsWrapper").show();
      $(".homeDisplay").hide();

      setTimeout(function(){resetHomePage();},60000);
    }   
    if (msg.changeMessage == "home scored"){
      displayTempMessage("Yellow Scored!!","Yellow",5000);
    }
    if(msg.changeMessage == "home scored game over"){
      displayTempMessage("Yellow Scored!!","Yellow",5000);
      displayTempMessage("Game Over: Yellow Wins","Yellow",5000);
      $("#allPlayersGraph").show();
      $(".gameStatsWrapper").show();
      $(".homeDisplay").hide();

      setTimeout(function(){resetHomePage();},60000);
    }

    if(msg.changeMessage == "penalty on visitors"){
      displayTempMessage("Penalty on Black","Red",5000);
    }
    if(msg.changeMessage == "penalty on home"){
      displayTempMessage("Penalty on Yellow","Red",5000);
    }
    if(msg.pending.msg == "gameOver"){
      $(".homeWinPercent").text(" ");
      $(".visitorsWinPercent").text(" ");
      $(".homeMatchupWins").text(" ");
      $(".visitorsMatchupWins").text(" ");
      $(".homeOdds").text(" ");
      $(".visitorsOdds").text(" ");
      saveHomeScoreHistory[0].push(saveHomeScoreHistory[0][saveHomeScoreHistory[0].length-1] + msg.pending.homeScoreHistory[0]);
      saveHomeScoreHistory[1].push(saveHomeScoreHistory[1][saveHomeScoreHistory[1].length-1] + msg.pending.homeScoreHistory[1]);
      saveVisitorsScoreHistory[0].push(saveVisitorsScoreHistory[0][saveVisitorsScoreHistory[0].length-1] + msg.pending.visitorsScoreHistory[0]);
      saveVisitorsScoreHistory[1].push(saveVisitorsScoreHistory[1][saveVisitorsScoreHistory[1].length-1] + msg.pending.visitorsScoreHistory[1]);

      $("#home1Change").text(msg.pending.homeScoreHistory[0]);
      $("#home2Change").text(msg.pending.homeScoreHistory[1]);
      $("#visitors1Change").text(msg.pending.visitorsScoreHistory[0]);
      $("#visitors2Change").text(msg.pending.visitorsScoreHistory[1]);

      $("#home1New").text(saveHomeScoreHistory[0][saveHomeScoreHistory[0].length-1]);
      $("#home2New").text(saveHomeScoreHistory[1][saveHomeScoreHistory[1].length-1]);
      $("#visitors1New").text(saveVisitorsScoreHistory[0][saveVisitorsScoreHistory[0].length-1]);
      $("#visitors2New").text(saveVisitorsScoreHistory[1][saveVisitorsScoreHistory[1].length-1]);

      var lineChartData = {
        labels : ["","","","","","","","","","","","",""],
        datasets : [
        {
          fillColor : "rgba(0,0,0,0)",
          strokeColor : myPlayerColors.home[0],
          data : saveHomeScoreHistory[0]
        },{
          fillColor : "rgba(0,0,0,0)",
          strokeColor : myPlayerColors.home[1],
          data : saveHomeScoreHistory[1]
        },{
          fillColor : "rgba(0,0,0,0)",
          strokeColor : myPlayerColors.visitors[0],
          data : saveVisitorsScoreHistory[0]
        },{
          fillColor : "rgba(0,0,0,0)",
          strokeColor : myPlayerColors.visitors[1],
          data : saveVisitorsScoreHistory[1]
        }]
      };
      var ctx = document.getElementById("allPlayersGraph").getContext("2d");
      var options = {scaleFontColor: "rgba(255, 255, 255,1)"};
      window.myLine = new Chart(ctx).Line(lineChartData,options);
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
function resetHomePage(){
  $(".gameStatsWrapper").hide();
  $("#allPlayersGraph").hide();
  $(".homeDisplay").show();
  document.getElementById('home1Change').innerHTML = "Calculating...";
  document.getElementById('home1New').innerHTML = "Calculating...";
  document.getElementById('home2Change').innerHTML = "Calculating...";
  document.getElementById('home2New').innerHTML = "Calculating...";
  document.getElementById('visitors1Change').innerHTML = "Calculating...";
  document.getElementById('visitors1New').innerHTML = "Calculating...";
  document.getElementById('visitors2Change').innerHTML = "Calculating...";
  document.getElementById('visitors2New').innerHTML = "Calculating...";

}
