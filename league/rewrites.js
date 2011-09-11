/**
 * this file contains the json representation for rewrite rules
**/
[
  {
    "from": "/",
    "to": "/_show/index/config",
    "method": "GET"
  }, {
    "from": "/live",
    "to": "/_list/live/ranked_games",
    "method": "GET",
    "query": {
      "descending": "true"
    }
  }, {
    "from": "/table",
    "to": "/_list/table/ranked_games",
    "method": "GET",
    "query": {
      "limit": 2,
      "descending": "true"
    }
  }, {
    "from": "/statistic",
    "to": "/_list/statistic/ranked_games",
    "method": "GET",
    "query": {
      "descending": "true"
    }
  }, {
    "from": "/statistic/:name",
    "to":"/_list/user/ranked_games",
    "method": "GET",
    "query": {
      "descending": "true",
      "name": ":name"
    }
  }, {
    "from": "/feed/ranked",
    "to": "/../../_changes",
    "method": "GET",
    "query": {
      "filter": "league/ranked_games"
    }
  }, {
    "from": "/feed/unranked",
    "to": "/../../_changes",
    "method": "GET",
    "query": {
      "filter": "league/unranked_games"
    }
  }, { // keeping relative urls sane
    "from": "/*",
    "to": "/*"
  }
]

