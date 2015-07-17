var sys = require("sys"),
    http = require("http"),
    fs = require("fs"),
    config = require("./config").config,
    te = require("./tableevents").TableEvents;

var options = {
  host: config.couchdb.host,
  port: config.couchdb.port,
  path: "/" + config.couchdb.database + "/",
  method: "POST",
  headers: {
    "Connection": "keep-alive",
    "Content-Encoding": "utf8",
    "Content-Type": "application/json"
  }
};

var nodeCouchDB = require("node-couchdb");
var couch = new nodeCouchDB(config.couchdb.host, config.couchdb.port);
var database = config.couchdb.database;

config.couchdb.user && (options.headers["Authorization"] = "Basic " + Buffer(config.couchdb.user + ":" + config.couchdb.password).toString("base64"))

var saveDoc = function(doc) {
  var req = http.request(options, function(res) {
      sys.debug("STATUS: " + res.statusCode);
      sys.debug("HEADERS: " + JSON.stringify(res.headers));
      res.setEncoding("utf8");
      res.on("data", function (chunk) {
        sys.debug("BODY: " + chunk);
      });
    });
  req.write(JSON.stringify(doc));
  req.end();
};

var pendingGame = {
    players: {
        home:[],
        visitors:[]
    },
    msg:""
};

var resetPending = function() {
     pendingGame = {
        players: {
            home:[],
            visitors:[]
        },
        msg:""
    };
    te.publish("assistant:pending", pendingGame);
};

var lookupPlayer = function(key, callback) {
    var viewURL = "_design/league/_view/by_rfid";
    couch.get(database, viewURL, function(err, resData) {
        if(err) {
            console.error(err);
            pendingGame.msg = err;
            callback([]);
        }
        var ret = resData.data.rows.filter(function(e) {
            return e.key == key;
        });
        console.log("Couch search returned ", ret);
        callback(ret);
    });
};

te.subscribe("referee:abort", function(game) {
  game.goals.forEach(function(goal) {
    saveDoc(goal);
  });
  resetPending();
});

te.subscribe("referee:finalwhistle", function(game) {
  saveDoc(game);
  resetPending();
});

te.subscribe("referee:fastgoal", function(goal) {
  saveDoc(goal);
});

te.subscribe("referee:update", function(backup) {
  fs.writeFile(__dirname + "/../backup.json", JSON.stringify(backup), function(err) {
    if(err) { throw err; }
  });
});

te.subscribe("referee:reset", function(client) {
  try {
    fs.unlinkSync(__dirname + "/../backup.json")
  } catch(e){}
  resetPending();
});

te.subscribe("referee:ready", function() {
  try {
    var backup = fs.readFileSync(__dirname + "/../backup.json");
    try {
      te.publish("assistant:resume", JSON.parse(backup));
      console.log("\x1b[1mRestored backup from last Session\x1b[0m\n");
    } catch(e) {
      console.log("\x1b[1mFound backup, but file is corrupted... :(\x1b[0m\n")
    }
  } catch(e){}
  resetPending();
});

te.subscribe("arduino:addplayer", function(data) {
  lookupPlayer(data.id, function(res) {
    if(res.length != 1) {
        console.error("Player RFID lookup failed: found: "+res.length);
        pendingGame.msg = "RFID lookup failed!";
    } else {
        var player = res[0].id;
        if(pendingGame.players[data.team].length < 2) {
            pendingGame.players[data.team].push(player);
            pendingGame.msg = player+" added to "+data.team;
        } else {
            console.error("Cannot add "+player+" to "+data.team+" because team already has "+pendingGame.players[data.team].length);
            pendingGame.msg = player+" ignored: "+data.team+" is full";
        }
    }
    if(pendingGame.players.home.length == 2 && pendingGame.players.visitors.length == 2) {
        te.publish("assistant:pending", pendingGame);
        te.publish("assistant:newgame", pendingGame);
    } else {
        te.publish("assistant:pending", pendingGame);
    }
  });
});

te.subscribe("referee:refusenewgame", function() {
    console.log("Attempted a newgame, but referee refused. Resetting RFID");
    resetPending();
});

