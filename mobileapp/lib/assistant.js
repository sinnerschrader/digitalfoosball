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
    msg:"",
    stats:"home 1"
};


var resetPending = function() {
     pendingGame = {
        players: {
            home:[],
            visitors:[]
        },
        msg:"",
        stats:""
    };
    te.publish("assistant:pending", pendingGame);
};

var lookupPlayer = function(key, callback) {
    var viewURL = "_design/league/_view/by_rfid";
    couch.get(database, viewURL, function(err, resData) {
        if(err) {
            console.error(err);
            pendingGame.msg = err;
            return callback([]);
        }
        var ret = resData.data.rows.filter(function(e) {
            return e.key == key;
        });
        console.log("Couch search returned ", ret);
        callback(ret);
    });
};
var playerWinPercent = function(key, callback) {
    var viewURL = "_design/league/_view/players";
    var ret;
    couch.get(database, viewURL, function(err, resData) {
      if(err) {
            console.error(err);
            pendingGame.msg = err;
            return callback([]);
        }
      ret = resData.data.rows.filter(function(e) {
          return e.key == key;
      });
      console.log("Couch search returned ", ret[0].value);
            var wins = ret[0].value.games.won;
            var losses = ret[0].value.games.lost;
            var winPercent = Math.round(100*wins/(wins+losses));
      callback(winPercent);
    });
};
var compareTeam = function(team1,team2){
  return ((team1[0] == team2[0] && team1[1] == team2[1])
        ||(team1[0] == team2[1] && team1[1] == team2[0]))
}
var gameOdds = function(home1,home2,visitors1,visitors2,callback){
    var viewURL = "_design/league/_view/players";
    var ret;
    var homeScore = 0;
    var visitorsScore = 0;
    couch.get(database, viewURL, function(err, resData) {
      if(err) {
            console.error(err);
            pendingGame.msg = err;
            return callback([]);
        }
      ret = resData.data.rows.filter(function(e) {
        if(e.key == home1 || e.key == home2)
        {
          homeScore += e.value.score;
        }
        else if(e.key == visitors1 || e.key == visitors2)
        {
          visitorsScore += e.value.score;
        }
      });
      //console.log("Couch search returned ", ret[0].value);
      console.log("h: "+homeScore+" v: "+visitorsScore);
      var prob = 1/(1+Math.pow(10,-1*Math.abs((homeScore- visitorsScore)/400)));
      prob = Math.round(prob*100);
      if(homeScore<visitorsScore && prob > 50){prob = 100-prob;}
      console.log("prob: "+prob);
      callback(prob);
    });
}
var teamStats = function(team,callback){
    var viewURL = "_design/league/_view/ranked_games";
    var winCounter = 0;
    var lossCounter = 0;
    var homeGoals = 0;
    var visitorsGoals = 0;
    var teamWinPercent = 0;
    couch.get(database, viewURL, function(err, resData) {
      if(err) {
            console.error(err);
            pendingGame.msg = err;
            return callback([]);
        }
      resData.data.rows.filter(function(e) {
        if(compareTeam(e.value.players.home,team))
        {
          for(var i = 0;i<e.value.goals.length;i++)
          {
              if(e.value.goals[i].scorer == "home"){homeGoals++;}
              else if(e.value.goals[i].scorer == "visitors"){visitorsGoals++;}
          }
          if(homeGoals>visitorsGoals){winCounter++;}
          else{lossCounter++;}
          homeGoals = 0;
          visitorsGoals = 0;
        } 
        else if(compareTeam(e.value.players.visitors,team)){
          for(var i = 0;i<e.value.goals.length;i++)
          {
              if(e.value.goals[i].scorer == "home"){visitorsGoals++;}
              else if(e.value.goals[i].scorer == "visitors"){homeGoals++;}
          }
          if(homeGoals>visitorsGoals){winCounter++;}
          else{lossCounter++;}
          homeGoals = 0;
          visitorsGoals = 0;
        }      
      });
      if(lossCounter == 0){teamWinPercent = 100}
      else{teamWinPercent = Math.round(100*winCounter/(winCounter+lossCounter));}
      callback(teamWinPercent);
    });
}

var matchupStats = function(homeTeam,visitorsTeam,callback){
    var viewURL = "_design/league/_view/ranked_games";
    var homeWinCounter = 0;
    var homeLossCounter = 0;
    var homeGoals = 0;
    var visitorsGoals = 0;
    couch.get(database, viewURL, function(err, resData) {
      if(err) {
            console.error(err);
            pendingGame.msg = err;
            return callback([]);
        }
      resData.data.rows.filter(function(e) {
        if(compareTeam(e.value.players.home,homeTeam) && compareTeam(e.value.players.visitors,visitorsTeam))
        {
          for(var i = 0;i<e.value.goals.length;i++)
          {
              if(e.value.goals[i].scorer == "home"){homeGoals++;}
              else if(e.value.goals[i].scorer == "visitors"){visitorsGoals++;}
          }
          if(homeGoals>visitorsGoals){homeWinCounter++;}
          else{homeLossCounter++;}
          homeGoals = 0;
          visitorsGoals = 0;
        }
        else if(compareTeam(e.value.players.visitors,homeTeam) && compareTeam(e.value.players.home, visitorsTeam)){
          for(var i = 0;i<e.value.goals.length;i++)
          {
              if(e.value.goals[i].scorer == "home"){visitorsGoals++;}
              else if(e.value.goals[i].scorer == "visitors"){homeGoals++;}
          }
          if(homeGoals<visitorsGoals){homeWinCounter++;}
          else{homeLossCounter++;}
          homeGoals = 0;
          visitorsGoals = 0;
        }
      });
      callback(homeWinCounter+" "+homeLossCounter);
    });

}

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

  var sendMessage = function(){
    if(pendingGame.players.home.length == 2 && pendingGame.players.visitors.length == 2) {
      te.publish("assistant:pending", pendingGame);
      
      teamStats(pendingGame.players.home,function(percent1){
        pendingGame.stats = ""+percent1;
        teamStats(pendingGame.players.visitors,function(percent2){
          pendingGame.stats += " "+percent2;
          matchupStats(pendingGame.players.home,pendingGame.players.visitors,function(winsLosses){
            pendingGame.stats += " "+winsLosses;
            gameOdds(pendingGame.players.home[0],pendingGame.players.home[1],pendingGame.players.visitors[0],pendingGame.players.visitors[1],function(odds){
              pendingGame.stats += " "+odds;
              te.publish("assistant:newgame", pendingGame);
            });
          });
        });
      });
    } else {
        te.publish("assistant:pending", pendingGame);
    }
  }
  


  lookupPlayer(data.id, function(res) {
    if(res.length != 1) {
        console.error("Player RFID lookup failed: found: "+res.length);
        pendingGame.msg = "RFID lookup failed!";
        sendMessage();
    } else {
        var player = res[0].id;
        playerWinPercent(res[0].id,function(myPercent){
          if(pendingGame.players[data.team].length < 2) {
            pendingGame.players[data.team].push(player);
            pendingGame.msg = player+" added to "+data.team;
            pendingGame.stats = "Win percent: "+myPercent+"%";
        } else {
            console.error("Cannot add "+player+" to "+data.team+" because team already has "+pendingGame.players[data.team].length);
            pendingGame.msg = player+" ignored: "+data.team+" is full";
        }
          sendMessage();
        });

    }

  });
});

te.subscribe("referee:refusenewgame", function() {
    console.log("Attempted a newgame, but referee refused. Resetting RFID");
    resetPending();
});

