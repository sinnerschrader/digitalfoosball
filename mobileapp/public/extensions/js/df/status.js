df.status = (function() {
  var lastPing = 0;
  var pending = "";
  df.subscribe("socket:message", function(msg) {

    if(pending != msg.pending && msg.pending.msg != ""){
      pending = msg.pending;

      displayTempMessage(pending.msg,"White",5000);
      if(pending.stats != ""){
        displayTempMessage(pending.stats,"White",5000);
      }

    }
    if(msg.changeMessage == "start game"){
      /*setTimeout(function(){displayTempMessage("Home overall win %: "+msg.teamStats[0],"White",5000);},2500);
      setTimeout(function(){displayTempMessage("Visitors overall win %: "+msg.teamStats[1],"White",5000);},2500);
      setTimeout(function(){displayTempMessage("This Matchup:","Yellow",7000);},4500);
      setTimeout(function(){displayTempMessage("Home Wins: "+msg.matchupStats[0]+"/"+(parseInt(msg.matchupStats[0])+parseInt(msg.matchupStats[1])),"Yellow",7000);},4500);
      setTimeout(function(){displayTempMessage("Visitor Wins: "+msg.matchupStats[1]+"/"+(parseInt(msg.matchupStats[1])+parseInt(msg.matchupStats[0])),"Yellow",7000);},4500);
      setTimeout(function(){displayTempMessage("Home teams odds: "+msg.odds+"%","Yellow",7000);},6500);
      */
      $(".homeWinPercent").text(msg.teamStats[0]+"%");
      $(".visitorsWinPercent").text(msg.teamStats[1]+"%");
      $(".homeMatchupWins").text(msg.matchupStats[0]+"/"+(parseInt(msg.matchupStats[0])+parseInt(msg.matchupStats[1])));
      $(".visitorsMatchupWins").text(msg.matchupStats[1]+"/"+(parseInt(msg.matchupStats[1])+parseInt(msg.matchupStats[0])));
      $(".homeOdds").text(msg.odds+"%");
      $(".visitorsOdds").text(100 - parseInt(msg.odds)+"%");
    }
    if(msg.changeMessage == "game aborted"){
        displayTempMessage("Game aborted","White",5000);
    }
    $("#statusdebug").text(JSON.stringify(msg));
    var goals = msg.game.goals.reduce(function(prev, curr) {prev[curr.scorer]+=curr.value; return prev; }, {home: 0, visitors: 0}),
            cplayers = msg.game.players.home.concat(msg.game.players.visitors).join(",");
    $("#statusdebug").text("Last game: "+JSON.stringify(goals)+" with players "+JSON.stringify(msg.game.players));
    if(msg.pending) {
      $("#statusdebug").append("<div>Pending game: "+JSON.stringify(msg.pending)+"</div>");
    }
    var ping = (msg.dogkick ? msg.dogkick : 0);
    if(ping>0 && ping-lastPing>60000){
      displayTempMessage("Raspberry Started","Green",5000);
    }
    lastPing = ping;
    var diff = Date.now() - (msg.dogkick ? msg.dogkick : 0);
    $("#statusdebug").append("<div>Raspberry last ping was "+diff+"ms ago</div>");
    
    if(msg.changeMessage == "visitors scored"){
      displayTempMessage("Black Scored!!","White",5000);
    }
    if(msg.changeMessage == "visitors scored game over"){
      displayTempMessage("Black Scored!!","White",5000);
      displayTempMessage("Game Over: Black Wins","White",5000);
    }   
    if (msg.changeMessage == "home scored"){
      displayTempMessage("Yellow Scored!!","Yellow",5000);
    }
    if(msg.changeMessage == "home scored game over"){
      displayTempMessage("Yellow Scored!!","Yellow",5000);
      displayTempMessage("Game Over: Yellow Wins","Yellow",5000);
    }

    if(msg.changeMessage == "penalty on visitors"){
      console.log("visitors penalty");
      displayTempMessage("Penalty on Black","Red",5000);
    }
    if(msg.changeMessage == "penalty on home"){
      console.log("home penalty");
      displayTempMessage("Penalty on Yellow","Red",5000);
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
