function(doc, req) {
  start({"headers": {"content-type": "text/html"}});

  var mustache = require("lib/mustache"),
      template = this.templates["statistic.html"],
      config = this.config,
      locales = JSON.parse(this.resources["locales_" + config.locale + ".json"]);

  var data = {
    stats: doc
  };

  for (var key in locales) {
    data["locales." + key] = locales[key];
  }

  var formatDate = function(time) {
    var date = new Date(time),
        day = date.getDate(),
        month = date.getMonth() + 1;
    return [day > 9 ? day : "0" + day, month > 9 ? month : "0" + month, date.getFullYear()].join(".");
  };

  data.stats.started = formatDate(data.stats.started);

  data.stats.avg = {
    gamesPerDay: ~~(data.stats.total.games / data.stats.total.days),
    durationPerGame: ~~(data.stats.total.duration / data.stats.total.games / 1000),
    durationPerDay: ~~(data.stats.total.duration / data.stats.total.days / 1000 / 60)
  };

  data.stats.goals = {
    home: {
      amount: data.stats.goals.home,
      percentage: ~~(data.stats.goals.home / data.stats.total.goals * 100)
    },
    visitors: {
      amount: data.stats.goals.visitors,
      percentage: ~~(data.stats.goals.visitors / data.stats.total.goals * 100)
    }
  };

  data.stats.victories = {
    home: {
      amount: data.stats.victories.home,
      percentage: ~~(data.stats.victories.home / data.stats.total.games * 100)
    },
    visitors: {
      amount: data.stats.victories.visitors,
      percentage: ~~(data.stats.victories.visitors / data.stats.total.games * 100)
    }
  };

  data.stats.games.map(function(game) {
    game.end = formatDate(game.end);
    game.players.home.length > 1 || game.players.home.push("");
    game.players.visitors.length > 1 || game.players.visitors.push("");
  });

  return {
    body: mustache.to_html(template, data)
  };
};

