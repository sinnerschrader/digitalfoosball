df.live = (function() {
  var format2digits = function(d) {
    return (d > 9 ? "" : "0") + d;
  };

  var formatTime = function(t) {
    var d = new Date(t);
    return [format2digits(d.getHours()), format2digits(d.getMinutes())].join(":") + " Uhr";
  };

  var formatTimespan = function(t1, t2) {
    var diff = t2 - t1,
        d = new Date(diff > 0 ? diff : 0);
    return [format2digits(d.getMinutes()), format2digits(d.getSeconds())].join(":") + " Min";
  };

  var updateTimer = function(time) {
    var now = new Date().getTime();
    timediff && (now -= timediff);
    $("#game time").html(formatTimespan(time, now));
  };

  var scoreSign = [],
      game, feed, avatars, timer, timediff;

  for (var i = 0; i < 45; ++i) {
    scoreSign.push("<span class=\"rly\"></span>");
  }

  var updateScoreboard = function(g) {
    if (game = g) {
      var goals = game.goals.reduce(function(prev, curr) {++prev[curr.scorer]; return prev; }, {home: 0, visitors: 0}),
          cplayers = game.players.home.concat(game.players.visitors).join(",");

      ["home", "visitors"].forEach(function(side) {
        $("#score" + side).attr("class", ["scorecard", ["negthree", "negtwo", "negone", "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"][goals[side]+3] || "full"].join(" "));
      });

      updateTimer(game.start);
      timer && clearInterval(timer) && (timer = undefined);
      timer = setInterval(function() {
        updateTimer(game.start);
      }, 1000);

      var players = JSON.parse(JSON.stringify(game.players));
      if (players.home.length == 1) {
        players.home.push("");
        players.visitors.push("");
      } else if (players.home.length == 0) {
        players.home = ["Weiß",""];
        players.visitors = ["Schwarz",""];
      }

      players = players.home.concat(players.visitors);

      var $ol = $("<ol />");
      for (var i = 0; i < 4; ++i) {
        var p = players[i];
        var pClass = p.replace(/\W/g, "-");
        pClass = pClass.replace(/[^A-Z]/gi, "-");
        var $li = $("<li class=\""+pClass+"\"><a href=\"#!/statistic/"+p+"\">" + p + "</a></li>");
        if (p == "") {
          $li.addClass("empty");
        }
        $li.appendTo($ol);
      }

      $("#game > ol").replaceWith($ol);

      if (game.players.avatars != avatars) {
        avatars = game.players.avatars;
        var $li = $("#game ol li:not(.empty)"),
            src;
        game.players.home.concat(game.players.visitors).forEach(function(player, index) {
          var avatar = game.players.avatars && (src = game.players.avatars[player]) && "background-image:url('" + src + "');";
          avatar && $li.eq(index).find("a").attr("style", avatar);
        });
      }

      $("aside").removeClass("hideboard").addClass("showboard");
    } else if(timer) {
      $("aside").removeClass("showboard").addClass("hideboard");
      clearInterval(timer) && (timer = undefined);
    }
  };

  var updateLivefeed = function(game, time) {
    if ((feed = game.feed) && feed.length) {
      var $feed = $("#feed ol#feed" + time);

      if ($feed.length == 0) {
        $feed = $("<ol />").attr("id", "feed" + time).prependTo("#feed");
      }

      for (var i = $feed.find("li").length; i < feed.length; ++i) {
        var entry = feed[i],
            time = {
              start: formatTime(game.start),
              goal: formatTimespan(game.start, entry.time),
              foul: formatTimespan(game.start, entry.time),
              end: formatTime(game.end),
              abort: formatTime(game.end)
            }[entry.type];

        $("<li class=\""+ entry.type +"\"><div>" + time + "</div><p>" + entry.head+"<br />"+ entry.body +"</p></li>").prependTo($feed);
      };
    }
  };

  df.subscribe("socket:message", function(msg) {
    if (!timediff && msg.time) {
      timediff = new Date().getTime() - msg.time;
    }
    updateScoreboard(msg.view === "scoreboard" ? msg.game : undefined);
    updateLivefeed(msg.game, msg.game.start);
  });

  df.subscribe("app:live", function($content) {
    avatars = undefined;
    $content.find("#scorehome, #scorevisitors").html(scoreSign.join(""));
    $.get("feed", function(partial) {
      $(partial).appendTo($content.find("#feed"));
    });
    updateScoreboard(game);
    game && updateLivefeed(game, game.start);
  });

  return {};
})();

