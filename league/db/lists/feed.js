function(head, req) {
  start({"headers": {"content-type": "text/html"}});

  var mustache = require("lib/mustache"),
      template = this.templates["feed.html"],
      config = this.config,
      locales = JSON.parse(this.resources["locales_" + config.locale + ".json"]);

  var data = {
    feeds: []
  };

  for (var key in locales) {
    data["locales." + key] = locales[key];
  }
  
  var format2digits = function(d) {
    return (d > 9 ? "" : "0") + d;
  };
  
  var formatTime = function(t) {
    var d = new Date(t);
    return [format2digits(d.getHours()), format2digits(d.getMinutes())].join(":") + " Uhr";
  }
  
  var formatTimespan = function(t1, t2) {
    var d = new Date(t2 - t1);
    return [format2digits(d.getMinutes()), format2digits(d.getSeconds())].join(":") + " Min";
  };

  var row;
  while (row = getRow()) {
    var game = row.value;
    feed = game.feed,
    events = [];
    
    for (var i = 0; i < feed.length; ++i) {
      var entry = feed[i];
      entry.time = {
        start: formatTime(game.start),
        goal: formatTimespan(game.start, entry.time),
        foul: formatTimespan(game.start, entry.time),
        end: formatTime(game.end),
        abort: formatTime(game.end)
      }[entry.type];
      events.push(entry);
    }
    data.feeds.push({events: events.reverse()});
  }

  return mustache.to_html(template, data);
};

