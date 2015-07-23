df.status = (function() {
  var lastPing = 0;
  var pending = "";
  df.subscribe("socket:message", function(msg) {

    if(pending != msg.pending && msg.pending.msg != ""){
      pending = msg.pending;

      displayTempMessage(pending.msg,"White",5000);
      displayTempMessage(pending.stats,"White",5000);

    }
    else{
      if(msg.changeMessage == "start game"){
        var myStats = msg.statsMessage.split(" ");
        setTimeout(function(){displayTempMessage("Home overall win %: "+myStats[0],"White",5000);},2500);
        setTimeout(function(){displayTempMessage("Visitors overall win %: "+myStats[1],"White",5000);},2500);
        setTimeout(function(){displayTempMessage("This Matchup:","Yellow",7000);},4500);
        setTimeout(function(){displayTempMessage("Home Wins: "+myStats[2],"Yellow",7000);},4500);
        setTimeout(function(){displayTempMessage("Visitor Wins: "+myStats[3],"Yellow",7000);},4500);
        setTimeout(function(){displayTempMessage("Home teams odds: "+myStats[4]+"%","Yellow",7000);},6500);
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
    }

  });

  return {};
})();
function displayTempMessage(message,color,time){
      var rand = Math.round(Math.random()*100000);
      $("#dylanDiv").show();
      $("#dylanDiv").append("<div id = tempDiv"+rand+" style='height:50px;text-align:center;'><font size='50' color = "+color+" text-align = center>"+message+"</font></div>");
      setTimeout(function(){$('#tempDiv'+rand).remove();if($('#dylanDiv').is(':empty')){$("#dylanDiv").hide();}},time);
}
