function(head, req) {
  start({"headers": {"content-type": "text/html"}});
  
  var mustache = require("lib/mustache"),
      template = this.templates["perfectGames.html"],
      config = this.config,
      locales = this.resources["locales_" + config.locale];

  var data = {
    games: []
  };

  var row;
  while (row = getRow()) {
    data.games.push(row.value);
  }
  return mustache.to_html(template,{data: JSON.stringify(data)});
};

