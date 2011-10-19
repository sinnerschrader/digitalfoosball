df.summary = (function() {
  var $summary = $("#summary"),
      $duration = $summary.find(".js_duration"),
      $score = $summary.find(".js_finalscore"),
      $tweet = $summary.find(".js_tweet");

  df.subscribe("socket:message", function(msg) {
    if (msg.view !== "summary") { return; }

    var goals = msg.game.goals.reduce(function(prev, curr) {++prev[curr.scorer]; return prev; }, {home: 0, visitors: 0}),
        score = [goals.home, goals.visitors],
        duration = parseInt((msg.game.end - msg.game.start) / 1000, 10),
        tweetMsg = "";

    df.config.scoreboard.inverted && score.reverse();
    $duration.html([parseInt(duration / 60, 10), parseInt(duration % 60, 10)].join("'") + "\"");
    $score.html(score.join(":"));

    if(msg.game.tweetURL == -1) {
      tweetMsg = "Tweet konnte nicht gesendet werden… :-(";
    } else if(msg.game.tweetURL == -2) {
      tweetMsg = "";
    } else if(msg.game.tweetURL.length > 5) {
      tweetMsg = '<a href="' + msg.game.tweetURL + '" class=\"js_target\">Yeah. Tweet wurde gesendet.</a>';
    } else {
      tweetMsg = "Tweet wird gesendet…";
    }
    $tweet.html(tweetMsg);
  });

  return {};
})();

