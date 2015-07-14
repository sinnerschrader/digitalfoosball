df.status = (function() {
  df.subscribe("socket:message", function(msg) {
    
    $("#statusdebug").text(JSON.stringify(msg));
    var goals = msg.game.goals.reduce(function(prev, curr) {prev[curr.scorer]+=curr.value; return prev; }, {home: 0, visitors: 0}),
            cplayers = msg.game.players.home.concat(msg.game.players.visitors).join(",");

    $("#statusdebug").text("Last game: "+JSON.stringify(goals)+" with players "+JSON.stringify(msg.game.players));
    if(msg.pending) {
      $("#statusdebug").append("<div>Pending game: "+JSON.stringify(msg.pending)+"</div>");
    }

    var diff = Date.now() - (msg.dogkick ? msg.dogkick : 0);
    $("#statusdebug").append("<div>Raspberry last ping was "+diff+"ms ago</div>");
    if(diff>1000){
      console.log();
      console.log(msg.dogkick);
      console.log();
      $("#dylanDiv").show();
      $("#dylanDiv").append("<div id = tempDivRaspberry style='height:50px; text-align:center;'><font size='50' text-align = center>Raspberry Started</div>");
      setTimeout(function(){$('#tempDivRaspberry').remove();},5000);
    }
    
    //displaying message when goals are scored
    var numGoals = msg.game.goals.length-1;
    if(msg.game.goals[numGoals].scorer == 'visitors' && msg.view == "scoreboard"){
      $("#dylanDiv").show();
      $("#dylanDiv").append("<div id = tempDiv"+numGoals+" style='height:50px; text-align:center;'><font size='50' color = Black  text-align = center>Black Scored!!</font></div>");
      setTimeout(function(){$('#tempDiv'+numGoals).remove();if($('#dylanDiv').is(':empty')){$("#dylanDiv").hide();}},5000);
      if(goals.visitors>5 && goals.visitors>goals.home+1){
        $("#dylanDiv").append("<div id = tempDivGO style='height:50px; text-align:center;'><font size='50' color = Black  text-align = center>Game Over: Black Wins</font></div>");
        setTimeout(function(){$('#tempDivGO').remove();if($('#dylanDiv').is(':empty')){$("#dylanDiv").hide();}},5000);
        
        
      }
    }
    else if (msg.game.goals[numGoals].scorer == 'home' && msg.view == "scoreboard"){
      $("#dylanDiv").show();
      $("#dylanDiv").append("<div id = tempDiv"+numGoals+" style='height:50px;text-align:center;'><font size='50' color = Yellow text-align = center>Yellow Scored!!</font></div>");
      setTimeout(function(){$('#tempDiv'+numGoals).remove();if($('#dylanDiv').is(':empty')){$("#dylanDiv").hide();}},5000);
      if(goals.home>5 && goals.home>goals.visitors+1){
        $("#dylanDiv").append("<div id = tempDivGO style='height:50px; text-align:center;'><font size='50' color = Yellow  text-align = center>Game Over: Yellow Wins</font></div>");
        setTimeout(function(){$('#tempDivGO').remove();if($('#dylanDiv').is(':empty')){$("#dylanDiv").hide();}},5000);
      }

    }
  });

  return {};
})();
