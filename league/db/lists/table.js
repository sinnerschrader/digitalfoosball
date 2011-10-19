function(head, req) {
  start({"headers": {"content-type": "text/html"}});
  
  var mustache = require("lib/mustache"),
      template = this.templates["table.html"],
      config = this.config,
      locales = JSON.parse(this.resources["locales_" + config.locale + ".json"]);

  var data = {
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

  var pos = 0,
      prev;
  
  for (var i = 0; i < data.players.length; ++i) {
    var player = data.players[i];
    ++pos;
    if (player.score != prev) {
    	player.position = pos;
    }
    prev = player.score;
    player.goals.diff = player.goals.scored - player.goals.conceded;
  }
  return mustache.to_html(template, data);
};

