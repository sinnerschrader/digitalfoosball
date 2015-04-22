var sys = require("sys"),
    http = require("http"),
    OAuth= require("oauth").OAuth,
    mustache = require("mustache"),
    config = require("./config").config,
    locales = require("./locales").locales,
    te = require("./tableevents").TableEvents;

te.subscribe("referee:finalwhistle", function(game) {
  if(!config.twitter) { return; }

  var goals = game.goals.reduce(function(prev, curr) {++prev[curr.scorer]; return prev; }, {home: 0, visitors: 0}),
      home_won = goals.home > goals.visitors;
  goals.winner = home_won ? goals.home : goals.visitors;
  goals.loser = !home_won ? goals.home : goals.visitors;

  var data = {
        id: new Date(game.start).getTime(),
        players: {
          winner: (home_won ? game.players.home : game.players.visitors).join(" " + locales["global.concat"] + " "),
          loser: (!home_won ? game.players.home : game.players.visitors).join(" " + locales["global.concat"] + " ")
        },
        goals: goals,
        hashtags: config.twitter.hashtags || []
      },
      tweet = mustache.to_html(locales[["press.tweet.", game.players.home.concat(game.players.visitors).length, "players"].join("")], data);

  oAuth = new OAuth(
    "https://twitter.com/oauth/request_token",
    "https://twitter.com/oauth/access_token",
    config.twitter.consumerKey,
    config.twitter.consumerSecret,
    "1.0A", null, "HMAC-SHA1"
  );

  oAuth.post(
    "https://api.twitter.com/1.1/statuses/update.json?trim_user=true",
    config.twitter.accessToken,
    config.twitter.accessTokenSecret,
    {"status": tweet},
    function(error, data) {
      if (error) {
        sys.debug(sys.inspect(error));
        te.publish("press:wrote", "-1");
      } else {
        sys.debug(data);
        te.publish("press:wrote", "https://twitter.com/#!/" + config.twitter.userId + "/status/" + JSON.parse(data).id_str);
      };
    }
  );
});

te.subscribe("referee:openingwhistle", function(game) {
  var players = game.players.home.concat(game.players.visitors).filter(function(player) { return player.charAt(0) === "@"; }).map(function(player) { return player.substring(1); }),
      avatars = {},
      fetchedTwitterers = 0;

  var fetchFromTwitter = function(p) {
    var opts = {
      host: "twitter.com",
      port: 80,
      path: ["/users/", ".json"].join(p)
    },
    buffer = "";

    http.get(opts, function(res) {
      res.on("data", function(chunk) {
        buffer += chunk;
      });
      res.on("end", function() {
        try {
          avatars["@" + p] = JSON.parse(buffer).profile_image_url;
        } catch(e) {
          sys.debug("Could not fetch the avatar of @" + p);
        }

        if (players.length == ++fetchedTwitterers) {
          te.publish("press:avatars", avatars);
        }
      });
    });
  };

  players.forEach(function(player) {
    fetchFromTwitter(player);
  });
});

