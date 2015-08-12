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
  dogkick: 0,
  changeMessage: "",
  playerStats: {
    home:[],
    visitors:[]
  },
  playerColors:{
    home:[],
    visitors: []
  },
  homeScoreHistory: [],
  visitorsScoreHistory: [],
  teamStats: [],
  matchupStats: [],
  odds:"",
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
var resetKicker = function(){
  kickertable.view = "home";
  kickertable.changeMessage = "";
  kickertable.playerStats = {home:[],visitors:[]};
  kickertable.playerColors = {home:[],visitors:[]};
  kickertable.homeScoreHistory = [];
  kickertable.visitorsScoreHistory = [];
  kickertable.teamStats = [];
  kickertable.matchupStats = [];
  kickertable.odds = "";
  kickertable.game = {
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
}


var events = {
  start: function(data) {
    resetGame(data && data.rematch);
    kickertable.game.start = new Date().getTime();

    if (data && data.players) {
      kickertable.game.players = data.players;
    }
    kickertable.view = "scoreboard";
    kickertable.changeMessage = "start game";
    kickertable.playerStats = data.playerStats;
    kickertable.playerColors = data.playerColors;
    kickertable.homeScoreHistory = data.homeScoreHistory;
    kickertable.visitorsScoreHistory = data.visitorsScoreHistory;
    kickertable.teamStats = data.teamStats;
    kickertable.matchupStats = data.matchupStats;
    kickertable.odds = data.odds;
    te.publish("referee:openingwhistle", kickertable.game);
  },
  abort: function() {
    kickertable.game.end = new Date().getTime();
    kickertable.changeMessage = "";
    te.publish("referee:abort", kickertable.game);

    resetGame();
    //resetKicker();
    kickertable.host = undefined;
    kickertable.changeMessage = "game aborted";
    te.publish("referee:update", kickertable);
  },
  quit: function() {
    resetGame();
    kickertable.host = undefined;
    te.publish("referee:update", kickertable);
  },
  undo: function(side) {
    kickertable.changeMessage = "";
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

  if(ruleset.penalties === true) {
      var last = kickertable.game.goals.slice(-1)[0];
      if(last && last.value > 0) {
        kickertable.game.goals.pop();
      }
      changeMessage = "";
      addGoal(side, -1);
      kickertable.changeMessage = "penalty on "+side;
      
  }
}

var addGoal = function(scorer, points) {
  kickertable.changeMessage = scorer+" scored";
  if(points == -1){
    kickertable.changeMessage = "";
  }
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
        kickertable.changeMessage += " game over";
      te.publish("referee:update", kickertable);
      finalTimeout = setTimeout(function(){
        kickertable.view = "home";
        kickertable.changeMessage = "";
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
  if (rematch) {
    var home = kickertable.game.players.home;
    var visitors = kickertable.game.players.visitors;
    resetKicker();
    kickertable.game.players.home = kickertable.game.players.visitors;
    kickertable.game.players.visitors = home;
  } else {
    resetKicker();
  };
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
  te.publish("referee:update", kickertable);
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
  resetKicker();
  kickertable.pending = data;
  kickertable.game.players = data.players;
  kickertable.playerStats = data.playerStats;
  kickertable.playerStats = data.playerStats;
  kickertable.homeScoreHistory = data.homeScoreHistory;
  kickertable.visitorsScoreHistory = data.visitorsScoreHistory;

  if(typeof data.players.home[0] != 'undefined' || typeof data.players.visitors[0] != 'undefined'){
    kickertable.view = "scoreboard";
    kickertable.changeMessage = "player added";
  }
  te.publish("referee:update", kickertable);
});

te.subscribe("arduino:dogkick", function() {
  kickertable.dogkick = Date.now();
  kickertable.changeMessage = "";
  te.publish("referee:update", kickertable);
});

te.publish("referee:ready");
module.exports.kickertable = kickertable;