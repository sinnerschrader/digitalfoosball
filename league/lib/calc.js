var http = require("http"),
    config = require("./config").config;

var queue = [],
    busy = true,
    lastGame,
    statistic;

var unifyName = function(name) {
  return name.toLowerCase().replace(/\s+/g, "-");
};

var sameday = function(a, b) {
  return a - (a % (1000 * 60 * 60 * 24)) === b - (b % (1000 * 60 * 60 * 24));
};

var getLastGame = function(cb) {
  var opts = {
    host: config.couchdb.host,
    port: config.couchdb.port,
    path: "/" + config.couchdb.database + "/_design/league/_view/ranked_games?limit=1&descending=true",
    headers: {
      "Connection": "keep-alive",
      "Content-Encoding": "utf8",
      "Content-Type": "application/json",
      "accept": "application/json"
    }
  };
  http.get(opts, function(res) {
    var ret = "";
    res.setEncoding("utf8");
    res.on("data", function(chunk) {
      ret += chunk;
    });
    res.on("end", function() {
      lastGame = JSON.parse(ret).rows[0];
      cb();
    });
  });
};

var getStatistic = function(cb) {
  var opts = {
    host: config.couchdb.host,
    port: config.couchdb.port,
    path: "/" + config.couchdb.database + "/statistic",
    headers: {
      "Connection": "keep-alive",
      "Content-Encoding": "utf8",
      "Content-Type": "application/json",
      "accept": "application/json"
    }
  };
  
  http.get(opts, function(res) {
    var ret = "";
    res.setEncoding("utf8");
    res.on("data", function(chunk) {
      ret += chunk;
    });
    res.on("end", function() {
      statistic = res.statusCode !== 404 ? JSON.parse(ret) : {
        _id: "statistic",
        total: {
          games: 0,
          goals: 0,
          duration: 0,
          days: 0
        },
        goals: {
          home: 0,
          visitors: 0
        },
        victories: {
          home: 0,
          visitors: 0
        },
        games: []
      };
      cb();
    });
  });
};

var getSince = function(cb) {
  var opts = {
    host: config.couchdb.host,
    port: config.couchdb.port,
    path: "/" + config.couchdb.database,
    headers: {
      "Connection": "keep-alive",
      "Content-Encoding": "utf8",
      "Content-Type": "application/json",
      "accept": "application/json"
    }
  };
  
  http.get(opts, function(res) {
    var ret = "";
    res.setEncoding("utf8");
    res.on("data", function(chunk) {
      ret += chunk;
    });
    res.on("end", function() {
      cb(JSON.parse(ret).update_seq);
    });
  });
};

var observe = function(since) {
  var opts = {
    host: config.couchdb.host,
    port: config.couchdb.port,
    path: "/" + config.couchdb.database + "/_changes?feed=continuous&include_docs=true&since=" + since + "&filter=league/unranked_games",
    headers: {
      "Connection": "keep-alive",
      "Content-Encoding": "utf8",
      "Content-Type": "application/json",
      "accept": "application/json"
    }
  };
  
  http.get(opts, function(res) {
    var buffer = "";
    res.setEncoding("utf8");
    res.on("data", function(chunk) {
      buffer += chunk;
      try {
        var ret = JSON.parse(buffer);
        ret.doc && queue.push(ret.doc);
        since = ret.seq || since;
        busy || calc();
        buffer = "";
      } catch(e) {}
    });
    res.on("end", function(x) {
      observe(since);
    });
  });
};

var getPlayerDocs = function(currGame, cb) {
  var toFetch = currGame.players.home.concat(currGame.players.visitors).reduce(function(a, b) { var id = unifyName(b); a[id] || (a[id] = b); return a; }, {});

  var opts = {
    host: config.couchdb.host,
    port: config.couchdb.port,
    path: "/" + config.couchdb.database + "/_all_docs?include_docs=true",
    method: "POST",
    headers: {
      "Connection": "keep-alive",
      "Content-Encoding": "utf8",
      "Content-Type": "application/json",
      "accept": "application/json"
    }
  };

  var req = http.request(opts, function(res) {
    var ret = "";
    res.setEncoding("utf8");
    res.on("data", function(chunk) {
      ret += chunk;
    });
    res.on("end", function() {
      cb(res.statusCode !== 404 ? JSON.parse(ret).rows.reduce(function(last, curr) {
        last[curr.key] = curr.doc || { "_id": curr.key, type: "player", registered: currGame.end, name: toFetch[curr.key], goals: { scored: 0, conceded: 0 }, games: { won: 0, lost: 0}, score: 0, opponents: {}, teammates: {}, graph: [], history: []};
        return last;
      }, {}) : null);
    });
  });

  req.write(JSON.stringify({"keys": Object.keys(toFetch)}));
  req.end();
};

var calcDelta = function(ls, ws, gw) {
  return parseInt(10 * (1 + gw - (1 / (1 + Math.pow(10, (ls - ws) / 400)))), 10);
};

var calcPlayer = function(player, teammate, opponents, score, won, currGame, goals, history_game, alreadyCalced) {
  var verb = won ? "won" : "lost";
  var operations = {
    won: function(a, b) {
      return a + b;
    },
    lost: function(a, b) {
      return a - b;
    }
  };

  var winner = goals.home > goals.visitors ? "home" : "visitors",
      loser = goals.home < goals.visitors ? "home" : "visitors";

  player.score = operations[verb](player.score, score);
  if (alreadyCalced) {
    player.history[0].score = operations[verb](player.history[0].score, score);
  } else { 
    player.goals.scored += goals[won ? winner : loser];
    player.goals.conceded += goals[won ? loser : winner];
    ++player.games[verb];
    if (teammate) {
      var tm = player.teammates[teammate.name] = player.teammates[teammate.name] || {won: 0, lost: 0};
      ++tm[verb];
      teammate.avatar && (tm.avatar = teammate.avatar);
    }
    opponents.forEach(function(opponent) {
      var op = player.opponents[opponent.name] = player.opponents[opponent.name] || {won: 0, lost: 0};
      ++op[verb];
      opponent.avatar && (op.avatar = opponent.avatar);
    });
    
    var graph = {score: player.score, time: currGame.end};
    if (player.graph.length && sameday(player.graph[player.graph.length - 1].time, graph.time)) {
      player.graph[player.graph.length - 1] = graph;
    } else {
      player.graph.push(graph);
    }

    var h = JSON.parse(JSON.stringify(history_game));
    h.score = won ? score : score * -1;
    player.history.unshift(h);
  }
}

var calc = function() {
  busy = true;
  queue.sort(function(a, b) {
    return (a.end < b.end) ? -1 : ((a.end > b.end) ? 1 : 0);
  });

  var currGame = queue.shift();
  
  if (!currGame) {
    busy = false;
    return;
  } else {
    getPlayerDocs(currGame, function(playerDocs) {
      var history_game = {
        goals: currGame.goals.reduce(function(a, b) { ++a[b.scorer]; return a;}, { home: 0, visitors: 0 }),
        players: {
          home: currGame.players.home,
          visitors: currGame.players.visitors
        },
        end: currGame.end
      };

      for (var id in playerDocs) {
        var doc = playerDocs[id];
        currGame.players.avatars && currGame.players.avatars[doc.name] && (doc.avatar = currGame.players.avatars[doc.name]);
        doc.history.length < 5 || (doc.history.length = 4);
      }

      var goals = currGame.goals.reduce(function(last, curr) { ++last[curr.scorer]; return last; }, { home: 0, visitors: 0 }),
          winner = goals.home > goals.visitors ? "home" : "visitors",
          loser = goals.home < goals.visitors ? "home" : "visitors";

      var goalValue = (goals[winner] - goals[loser]) / 10;
          goalValue > 0 || (goalValue = 0);


      var winnerDocs = currGame.players[winner].map(function(name) { return playerDocs[unifyName(name)]; }),
          loserDocs = currGame.players[loser].map(function(name) { return playerDocs[unifyName(name)]; });


      var deltas = [];

      winnerDocs.forEach(function(winnerPlayer) {
        loserDocs.forEach(function(loserPlayer) {
          deltas.push(calcDelta(loserPlayer.score, winnerPlayer.score, goalValue));
        });
      });

      var winner1 = winnerDocs[0],
          winner2 = winnerDocs[1],
          loser1 = loserDocs[0],
          loser2 = loserDocs[1];

      calcPlayer(winner1, winner2, loserDocs, deltas.length === 1 ? deltas[0] * 2 : deltas[0] + deltas[1], true, currGame, goals, history_game);
      winner2 && calcPlayer(winner2, winner1, loserDocs, deltas[2] + deltas[3], true, currGame, goals, history_game, winner1 === winner2);

      calcPlayer(loser1, loser2, winnerDocs, deltas.length === 1 ? deltas[0] * 2 : deltas[0] + deltas[2], false, currGame, goals, history_game);
      loser2 && calcPlayer(loser2, loser1, winnerDocs, deltas[1] + deltas[3], false, currGame, goals, history_game, loser1 === loser2);

      statistic.started = statistic.started || currGame.end;
      ++statistic.total.games;
      statistic.total.goals += currGame.goals.length;
      statistic.total.duration += (currGame.end - currGame.start);

      if (!sameday(lastGame ? lastGame.end : 0, currGame.end)) {
        ++statistic.total.days
      }

      var goals = currGame.goals.reduce(function(a, b) { ++a[b.scorer]; return a; }, {home: 0, visitors: 0});
      statistic.goals.home += goals.home;
      statistic.goals.visitors += goals.visitors;
      goals.home > goals.visitors ? (++statistic.victories.home) : (++statistic.victories.visitors);

      statistic.games.length > 4 && (statistic.games.length = 4);
      statistic.games.unshift(history_game);

      var toWrite = [];
      for (var id in playerDocs) {
        toWrite.push(playerDocs[id]);
      }
      currGame.ranked = true;
      toWrite.push(currGame);
      toWrite.push(statistic);

      var opts = {
        host: config.couchdb.host,
        port: config.couchdb.port,
        path: "/" + config.couchdb.database + "/_bulk_docs",
        method: "POST",
        headers: {
          "Connection": "keep-alive",
          "Content-Encoding": "utf8",
          "Content-Type": "application/json",
          "accept": "application/json",
          "Authorization": "Basic " + Buffer(config.couchdb.user + ":" + config.couchdb.password).toString("base64")
        }
      };

      var req = http.request(opts, function(res) {
        var ret = "";
        res.setEncoding("utf8");
        res.on("data", function(chunk) {
          ret += chunk;
        });
        res.on("end", function() {
          ret = JSON.parse(ret);

          statistic["_rev"] = ret.filter(function(doc) { if (doc.id === "statistic") { return doc; }})[0].rev;
          lastGame = currGame;
          calc();
        });
      });

      req.write(JSON.stringify({"docs": toWrite}));
      req.end();
    });
  }
};

getLastGame(function() {
  getStatistic(function() {
    getSince(function(since) {
      observe(since);

      var opts = {
        host: config.couchdb.host,
        port: config.couchdb.port,
        path: "/" + config.couchdb.database + "/_design/league/_view/unranked_games",
        headers: {
          "Connection": "keep-alive",
          "Content-Encoding": "utf8",
          "Content-Type": "application/json",
          "accept": "application/json"
        }
      };

      http.get(opts, function(res) {
        var ret = "";
        res.setEncoding("utf8");
        res.on("data", function(chunk) {
          ret += chunk;
        });
        res.on("end", function() {
          queue.push.apply(queue, JSON.parse(ret).rows.map(function(row) { return row.value; }));
          calc();
        });
      });
    });
  });
});

