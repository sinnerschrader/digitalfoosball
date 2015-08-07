var http = require("http"),
    url = require("url"),
    sys = require("sys"),
    socketio = require("socket.io"),
    fs = require("fs"),
    mustache = require("mustache"),
    express = require("express"),
    config = require("./config").config,
    locales = require("./locales").locales,
    referee = require("./referee"),
    te = require("./tableevents").TableEvents;

var app = express.createServer(),
    sockapp = express.createServer(); 
var kTable = referee.kickertable;
app.get("/game",function(req,res){
    var goals = kTable.game.goals;
    var homeScore = 0, visitorsScore = 0;
    console.log("Dylan was here");
    console.log(goals);
    for(var counter = 0; counter<goals.length; counter++)
    {
      if(goals[counter].scorer == 'home')
      {
        homeScore++;
      }
      else
      {
        visitorsScore++;
      }
    }
    console.log("hs: "+homeScore+" vs: "+visitorsScore);
    var opts = {"Content-Type": "application/json"};
    res.writeHead(200,opts);
    res.end(JSON.stringify("nope"));
});
app.configure(function() {
  app.set("views", __dirname + "/../views");
  app.set("view options", {layout: false});
  app.set("view engine", "html");

  app.register(".html", {
    compile: function(str, options){
      return function(locals){
        return mustache.to_html(str, locals);
      };
    }
  });
  //app.use(express.compiler({ src: __dirname + "/../public", enable: ["less"] }));
  app.use(express.favicon(__dirname + "/../public/images/favicons/fi_standard.ico"));
  app.use(express.static(__dirname + "/../public"));
});

app.configure("production", function() {
  sys.debug("Using express.js config for \x1b[1mproduction\x1b[0m mode\n");
  app.use(express.logger({
    format: ":date :method :status HTTP/:http-version :url :response-time  :user-agent",
    stream: fs.createWriteStream(__dirname + "/../../../shared/logs/access_" + new Date().getTime() + ".log")
  }));
  app.use(express.errorHandler());
});

app.configure("development", function() {
  sys.debug("Using express.js config for \x1b[1mdevelopment\x1b[0m mode\n");
  app.use(express.logger({format: "\x1b[1m:method\x1b[0m :status HTTP/:http-version \x1b[33m:url\x1b[0m :response-time"}));
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
});

app.post("/events/*kick*", function(req, res) {
  var opts = {"Content-Type": "text/plain"};
  te.publish("arduino:dogkick", {});
  res.writeHead(200, opts);
  res.end("YIP!");
});

app.post("/events/addplayer*", function(req, res) {
  var parse = url.parse(req.url, true),
      query = parse.query,
      parts = parse.pathname.split("/"),
      team = parts[3],
      opts = {"Content-Type": "text/plain"};

  if({visitors: true, home: true}[team] && query.id) {
    te.publish("arduino:addplayer", {id:query.id, team:team});
    res.writeHead(200, opts);
    res.end("Added player by ID");
  } else {
    res.writeHead(400, opts);
    res.end();
  }
});

app.post("/events/abort*", function(req, res) {
  var opts = {"Content-Type": "text/plain"};
  te.publish("arduino:abort", {});
  res.writeHead(200, opts);
  res.end("Game aborted");
});

app.post("/events/*", function(req, res){
  var parts = req.url.split("/"),
      type = parts[2],
      action = parts[3],
      opts = {"Content-Type": "text/plain"};

  if ({goals:true, undo:true, abort:true, penalty:true}[type] && {visitors: true, home: true}[action]) {
    te.publish("arduino:"+type, action);

    res.writeHead(200, opts);
    res.end("Handled " + type + " for " + action);
  } else {
    res.writeHead(404, opts);
    res.end();
  }
});

var data = {
  production: /\bproduction\b/.test(process.env.NODE_ENV),
  cdn: config.cdn,
  rev: config.rev,
  scoreboard: config.scoreboard,
  config: JSON.stringify({
    env: process.env.NODE_ENV,
    scoreboard: config.scoreboard,
    ga: config.ga,
    socketconf: config.socketconf
  })
};

for (var key in locales) {
  data["locales." + key] = locales[key];
}

app.get('/', function(req, res){
  //don't switch scoreboard on wall mounted iPad
  //should be checked with cookie value
  if(req.headers['user-agent'].indexOf("iPad") != -1) { 
    data.scoreboard.inverted = false;
  }
  res.render("index", data);
});

app.get("/dialog", function(req, res) {
  res.render("partials/dialog", data);
});

app.listen(config.server.port);
sys.debug("\x1b[1mExpress server started on port " + app.address().port + "\x1b[0m");

sockapp.listen(config.server.socketport);
sys.debug("\x1b[1mExpress WebSocket server started on port " + sockapp.address().port + "\x1b[0m\n");

var io = socketio.listen(sockapp);
io.sockets.on("connection", function(socket) {
  te.subscribeOnce("referee:welcome", function(msg) {
    var copy = JSON.parse(JSON.stringify(msg));
    msg.time = new Date().getTime();
    socket.json.send(msg);
  });
  te.publish("socket:connect", socket);

  socket.on("message", function(msg) {
    te.publish("socket:message", socket, msg);
  });

  socket.on("disconnect", function() {
    te.publish("socket:disconnect", socket);
  });
});

te.subscribe("referee:update", function(msg) {
  io.sockets.json.send(msg);
});

process.on("uncaughtException", function (err) {
  sys.debug("[UNCAUGHT EXCEPTION] " + err + "\n" + JSON.stringify(err, null, " "));
  process.exit();
});

