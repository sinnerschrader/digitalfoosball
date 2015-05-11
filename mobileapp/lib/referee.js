var sys = require("sys"),
    http = require("http"),
    config = require("./config").config,
    announcer = require("./announcer"),
    assistant = require("./assistant"),
    press = require("./press"),
    te = require("./tableevents").TableEvents;


var kickertable = {
  view: "home",
  host: undefined,
  game: {
    type: "game",
    start: 0,
    end: 0,
    players: {
      home: [],
      visitors: []
    },
    goals: [],
    tweetURL: "",
    feed: []
  }
},
ruleset = config.rulesets[config.ruleset],
finalTimeout;



var events = {
  start: function(data) {
    resetGame(data && data.rematch);
    kickertable.game.start = new Date().getTime();

    if (data && data.players) {
      kickertable.game.players = data.players;
    }

    kickertable.view = "scoreboard";
    te.publish("referee:openingwhistle", kickertable.game);
  },
  abort: function() {
    kickertable.game.end = new Date().getTime();
    te.publish("referee:abort", kickertable.game);

    resetGame();
    kickertable.host = undefined;
    te.publish("referee:update", kickertable);
  },
  quit: function() {
    resetGame();
    kickertable.host = undefined;
    te.publish("referee:update", kickertable);
  },
  undo: function(side) {
    if(!side){
      kickertable.game.goals.pop();
    } else {
      for (var idx = kickertable.game.goals.length - 1; idx >= 0; --idx) {
        if (kickertable.game.goals[idx].scorer === side) { break; }
      }
      if(idx<0){
        return;
      }
      var tmp = kickertable.game.goals.slice(idx+1);
      kickertable.game.goals.length = idx;
      kickertable.game.goals.push.apply(kickertable.game.goals, tmp);
    }
    te.publish("referee:undo", kickertable.game);
  },
  amend: function(data){
    if(data.goal == 'plus'){
      addGoal(data.score);
    } else if(data.goal == 'minus'){
      events.undo(data.score);
    } else if(data.goal == 'penalty'){
      addPenalty(data.score);
    }
  }
};

var addPenalty = function(side) {
  var last = kickertable.game.goals.slice(-1)[0];
  if(last && last.value > 0) {
    kickertable.game.goals.pop();
  }
  addGoal(side, -1);
}

var addGoal = function(scorer, points) {
  var goal = { 
    type: "goal", 
    scorer: scorer, 
    time: new Date().getTime(),
    value: points ? points : 1
  };
  
  if (kickertable.view == "scoreboard") {

    var goals = kickertable.game.goals.reduce(function(prev, curr) {prev[curr.scorer] += curr.value; return prev; }, {home: 0, visitors: 0});

    if(goal.value < 0 && goals[goal.scorer] <= ruleset.min) {
      //Don't allow penalty points to drive score below minimum
      return;
    }

    kickertable.game.goals.push(goal);
    goals[goal.scorer] += goal.value;

    var leader = Math.max(goals.home, goals.visitors),
        trailer = Math.min(goals.home, goals.visitors);

    if (leader >= ruleset.win && leader - trailer >= ruleset.diff || leader >= ruleset.max) {
      te.publish("referee:update", kickertable);
      finalTimeout = setTimeout(function(){
        kickertable.view = "home";
        kickertable.game.tweetURL = "-2";
        kickertable.game.end = new Date().getTime();
        te.publish("referee:finalwhistle", kickertable.game);
      }, 2000);
    } else {
      te.publish("referee:goal", kickertable.game);
      te.publish("referee:update", kickertable);
    }
  } else {
    te.publish("referee:fastgoal", goal);
  }
}

var resetGame = function(rematch) {
  kickertable.view = "home";
  kickertable.game.start = 0;
  kickertable.game.end = 0;
  kickertable.game.tweetURL = "0";

  if (rematch) {
    var home = kickertable.game.players.home;
    kickertable.game.players.home = kickertable.game.players.visitors;
    kickertable.game.players.visitors = home;
  } else {
    kickertable.game.players = {
      home: [],
      visitors: []
    }
  };

  kickertable.game.goals = [];
  kickertable.game.feed = [];

  te.publish("referee:reset");
};

te.subscribe("assistant:resume", function(backup) {
  kickertable = backup;
  kickertable.host = undefined;
  te.publish("referee:update", kickertable);
});

te.subscribe("socket:connect", function(client) {
  te.publish("referee:welcome", kickertable);
});

te.subscribe("socket:message", function(client, msg) {
  kickertable.host = client.id;
  clearTimeout(finalTimeout);
  (events[msg.event]) && events[msg.event](msg.data);
});

te.subscribe("socket:disconnect", function(client) {
  if (kickertable.host == client.id) {
    kickertable.host = undefined;
    te.publish("referee:update", kickertable)
  };
});

te.subscribe("press:avatars", function(avatars) {
  kickertable.game.players.avatars = avatars;
  te.publish("referee:update", kickertable);
});

te.subscribe("press:wrote", function(tweetURL) {
  kickertable.game.tweetURL = tweetURL;

  if (kickertable.view === "summary") {
    te.publish("referee:update", kickertable);
  }
});

te.subscribe("announcer:announcement", function(msg) {
  kickertable.game.feed.push(msg);
  te.publish("referee:update", kickertable); 
});

te.subscribe("arduino:goals", function(scorer) {
  addGoal(scorer);
});

te.subscribe("arduino:undo", function(side) {
  events.undo(side);
});

te.subscribe("arduino:abort", function(side) {
  events.abort();
});

te.subscribe("arduino:penalty", function(side) {
  addPenalty(side);
});

te.subscribe("assistant:newgame", function(data) {
  if(kickertable.game.start == 0 || kickertable.game.end > 0) {
    events.start(data);
  } else {
    //Refuse to start a new game if one is already in progress
    te.publish("referee:refusenewgame");
  }
});

te.subscribe("assistant:pending", function(data) {
  kickertable.pending = data;
  te.publish("referee:update", kickertable);
});

te.publish("referee:ready");
