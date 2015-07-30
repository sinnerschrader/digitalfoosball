/**
 * this file contains the json representation for rewrite rules
**/
[
  {
    "from": "/",
    "to": "/_show/index",
    "method": "GET"
  }, {
    "from": "/live",
    "to": "/_list/live/players",
    "method": "GET"
  }, {
    "from": "/feed",
    "to": "/_list/feed/ranked_games",
    "query": {
      "limit": "5",
      "descending": "true"
    }
  }, {
    "from": "/table",
    "to": "/_list/table/players",
    "method": "GET"
  }, {
    "from": "/statistic",
    "to": "/_show/statistic/statistic",
    "method": "GET"
  },{
    "from":"/perfectGames",
    "to":"/_list/perfectGames/perfect_games",
    "method":"GET"
  },{
    "from": "/statistic/:name",
    "to":"/_list/user/players",
    "method": "GET",
    "query": {
      "name": ":name"
    }
  }, {
    "from": "/guide",
    "to": "/_show/guide",
    "method": "GET"
  }, {
    "from": "/tos",
    "to": "/_show/tos",
    "method": "GET"
  }, { // keeping relative urls sane
    "from": "/*",
    "to": "/*"
  }
]

