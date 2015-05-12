df.status = (function() {
  df.subscribe("socket:message", function(msg) {

    $("#statusdebug").text(JSON.stringify(msg));
    var goals = msg.game.goals.reduce(function(prev, curr) {prev[curr.scorer]+=curr.value; return prev; }, {home: 0, visitors: 0}),
            cplayers = msg.game.players.home.concat(msg.game.players.visitors).join(",");

    $("#statusdebug").text("Last game: "+JSON.stringify(goals)+" with players "+JSON.stringify(msg.game.players));

    if(msg.pending) {
      $("#statusdebug").append("<div>Pending game: "+JSON.stringify(msg.pending)+"</div>");
    }
  });

  return {};
})();
