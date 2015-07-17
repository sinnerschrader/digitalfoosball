var config = require("./config").config,
    locales = require("./locales").locales,
    mustache = require("mustache"),
    te = require("./tableevents").TableEvents;

var makeAnnouncement = function(type, game, time) {
  var goals = game.goals.reduce(function(prev, curr) {prev[curr.scorer]+= curr.value; return prev; }, {home: 0, visitors: 0}),
      quickgame = game.players.home.length === 0,
      players = {
        home: quickgame ? config.scoreboard.home : game.players.home.join(" " + locales["global.concat"] + " "),
        visitors: quickgame ? config.scoreboard.visitors : game.players.visitors.join(" " + locales["global.concat"] + " ")
      },
      last_goal = game.goals.slice(~0)[0];

  var data = {
    quickgame: quickgame,
    players: players,
    goals: goals,
    last_scorer: game.goals.length ? players[last_goal.scorer] : undefined
  };

  var announcement = {
    type: type,
    head: mustache.to_html(locales[["announcer", type, "head"].join(".")], data),
    body: mustache.to_html(locales[["announcer", type, "body"].join(".")], data),
    time: time || undefined
  };

  te.publish("announcer:announcement", announcement);
};

te.subscribe("referee:openingwhistle", function(game) {
  makeAnnouncement("start", game);
});

te.subscribe("referee:finalwhistle", function(game) {
  makeAnnouncement("end", game);
});

te.subscribe("referee:abort", function(game) {
  makeAnnouncement("abort", game);
});

te.subscribe("referee:goal", function(game) {
  makeAnnouncement("goal", game, game.goals.slice(~0)[0].time);
});

te.subscribe("referee:undo", function(game) {
  makeAnnouncement("foul", game, new Date().getTime());
});

