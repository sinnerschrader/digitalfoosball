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

te.subscribe("referee:abort", function(game) {
  game.goals.forEach(function(goal) {
    saveDoc(goal);
  });
});

te.subscribe("referee:finalwhistle", function(game) {
  saveDoc(game);
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
});

