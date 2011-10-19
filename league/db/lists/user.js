function(head, req) {
  start({"headers": {"content-type": "text/html"}});

  var mustache = require("lib/mustache"),
      template = this.templates["user.html"],
      config = this.config,
      locales = JSON.parse(this.resources["locales_" + config.locale + ".json"]);

  var data = {};

  for (var key in locales) {
    data["locales." + key] = locales[key];
  }

  var players = [];
  var scores = [];

  var row;
  while (row = getRow()) {
    var player = row.value;
    if (!data.user && player.name === req.query["name"]) {
      data.user = player;
    }
    players.push(player);
    scores.push(player.score);
  }
  players.sort(function(a, b) { return (a.score > b.score) ? -1 : ((a.score < b.score) ? 1 : 0); });
  scores.sort(function(a, b) { return (a > b) ? -1 : ((a < b) ? 1 : 0); });

  data.user.rank = scores.indexOf(data.user.score) + 1;

  var opponents = [];
  for (var name in data.user.opponents) {
    var opponent = data.user.opponents[name];
    opponent.name = name;
    opponents.push(opponent);
  }
  opponents.sort(function(a, b) { return (a.lost > b.lost) ? -1 : ((a.lost < b.lost) ? 1 : 0); });
  data.user.nemesis = opponents[0];
  data.user.nemesis.quote = ~~(data.user.nemesis.lost / (data.user.nemesis.won + data.user.nemesis.lost) * 100);

  var teammates = [];
  for (var name in data.user.teammates) {
    var teammate = data.user.teammates[name];
    teammate.name = name;
    teammates.push(teammate);
  }
  teammates.sort(function(a, b) { return (a.won > b.won) ? -1 : ((a.won < b.won) ? 1 : 0); });
  data.user.buddy = teammates[0];
  data.user.buddy && (data.user.buddy.quote = ~~(data.user.buddy.won / (data.user.buddy.won + data.user.buddy.lost) * 100));

  var idx = players.indexOf(data.user);
  data.user.challenger = (idx - 1 >= 0) ? players[idx - 1] : players[idx + 1];
  data.user.challenger.rank = scores.indexOf(data.user.challenger.score) + 1;

  var totalgames = data.user.games.won + data.user.games.lost;
  data.user.games = {
    won: {
      amount: data.user.games.won,
      percentage: ~~(data.user.games.won / totalgames * 100)
    },
    lost: {
      amount: data.user.games.lost,
      percentage: ~~(data.user.games.lost / totalgames * 100)
    }
  };

  var totalgoals = data.user.goals.scored + data.user.goals.conceded;
  data.user.goals = {
    scored: {
      amount: data.user.goals.scored,
      percentage: ~~(data.user.goals.scored / totalgoals * 100)
    },
    conceded: {
     amount: data.user.goals.conceded,
     percentage: ~~(data.user.goals.conceded / totalgoals * 100)
    }
  };

  var new_graph = [];
  for (var i = 0; i < data.user.graph.length; ++i) {
    var event = data.user.graph[i];
    if (new_graph[i - 1]) {
      var old_event = new_graph[new_graph.length - 1],
          diff = Math.floor((event.time - old_event.time) / (1000 * 60 * 60 * 24));
      for (;diff;--diff, new_graph.push(old_event));
    }
    new_graph.push(event);
  }
  var last_event = new_graph[new_graph.length -1];
  var diff_today = Math.floor((new Date().getTime() - last_event.time) / (1000 * 60 * 60 * 24));
  for (;diff_today;--diff_today, new_graph.push(last_event));

  data.user.graph = new_graph.reduce(function(a, b) {
    var abs = Math.abs(b.score);
    a.high > abs || (a.high = abs);
    a.ranks.push(b.score);
    return a;
  }, { high: 0, ranks: [] });
  data.user.graph.high = Math.ceil(data.user.graph.high / 10) * 10;
  data.user.graph.low = data.user.graph.high * -1;

  var formatDate = function(time) {
    var date = new Date(time),
        day = date.getDate(),
        month = date.getMonth() + 1;
    return [day > 9 ? day : "0" + day, month > 9 ? month : "0" + month, date.getFullYear()].join(".");
  };

  data.user.registered = formatDate(data.user.registered);
  data.user.history.map(function(game) {
    game.end = formatDate(game.end);
    game.players.home.length > 1 || game.players.home.push("");
    game.players.visitors.length > 1 || game.players.visitors.push("");
    game.score < 0 || (game.score = "+" + game.score);
    return game;
  });

  return mustache.to_html(template, data);
};

