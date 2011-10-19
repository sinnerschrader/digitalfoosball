function(head, req) {
  start({"headers": {"content-type": "text/html"}});

  var mustache = require("lib/mustache"),
      template = this.templates["live.html"],
      config = this.config,
      locales = JSON.parse(this.resources["locales_" + config.locale + ".json"]);

  var data = {
    scoreboard: config.scoreboard,
    players: []
  };

  for (var key in locales) {
    data["locales." + key] = locales[key];
  }
  
  var row;
  while (row = getRow()) {
    data.players.push(row.value);
  }

  data.players.sort(function(a, b) {
    return (a.score > b.score) ? -1 : ((a.score < b.score) ? 1 : 0);
  });

  data.players.length > 10 && (data.players.length = 10);

  var pos = 0,
      prev;
  for (var i = 0; i < data.players.length; ++i) {
    var player = data.players[i];
    ++pos;
    if (player.score != prev) {
      player.position = pos;
    }
    prev = player.score;
  }

  return mustache.to_html(template, data);
};

