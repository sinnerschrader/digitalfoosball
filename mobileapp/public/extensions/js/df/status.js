df.status = (function() {
  var lastPing = 0;
  var pending = "";
  df.subscribe("socket:message", function(msg) {

    if(pending != msg.pending && msg.pending.msg != ""){
      //different than previous message
      pending = msg.pending;
      displayTempMessage(pending.msg,"White");
    }
    if(msg.changeMessage == "start game"){
      if(msg.game.players.home.length == 1){
        displayTempMessage("Game Started: ","White");
        displayTempMessage(msg.game.players.home[0]+" vs "+msg.game.players.visitors[0],"White");
      }
      else if(msg.game.players.home.length == 2){
        displayTempMessage("Game Started: ","White");
        displayTempMessage(msg.game.players.home[0]+" and "+msg.game.players.home[1]+" vs "+msg.game.players.visitors[0]+" and "+msg.game.players.visitors[1],"White");
      }
    }
    if(msg.changeMessage == "game aborted"){
        displayTempMessage("Game aborted","White");
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
      displayTempMessage("Raspberry Started","Green");
    }
    lastPing = ping;
    var diff = Date.now() - (msg.dogkick ? msg.dogkick : 0);
    $("#statusdebug").append("<div>Raspberry last ping was "+diff+"ms ago</div>");
    


    //displays message when goals are scored
    var numGoals = msg.game.goals.length-1;
    if(msg.changeMessage == "visitors scored"){
      displayTempMessage("Black Scored!!","Black");
    }
    if(msg.changeMessage == "visitors scored game over"){
      displayTempMessage("Black Scored!!","Black");
      displayTempMessage("Game Over: Black Wins","Black");
    }   
    if (msg.changeMessage == "home scored"){
      displayTempMessage("Yellow Scored!!","Yellow");
    }
    if(msg.changeMessage == "home scored game over"){
      displayTempMessage("Yellow Scored!!","Yellow");
      displayTempMessage("Game Over: Yellow Wins","Yellow");
    }

  });

  return {};
})();
function displayTempMessage(message,color){
      var rand = Math.round(Math.random()*100000);
      $("#dylanDiv").show();
      $("#dylanDiv").append("<div id = tempDiv"+rand+" style='height:50px;text-align:center;'><font size='50' color = "+color+" text-align = center>"+message+"</font></div>");
      setTimeout(function(){$('#tempDiv'+rand).remove();if($('#dylanDiv').is(':empty')){$("#dylanDiv").hide();}},5000);
}
