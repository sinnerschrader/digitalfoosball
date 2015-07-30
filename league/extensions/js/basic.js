/**
 * Loading configuration starts here
 * Path will be prefixed with baseURL
 */
var dependencies = [
  "extensions/js/ext/jquery-1.7.1.js",
  "extensions/js/ext/sammy-0.6.3.js",
  "extensions/js/ext/socket.io.js",

  "extensions/js/df/df.js",
  "extensions/js/df/socket.js",
  "extensions/js/df/app.js",
  "extensions/js/df/live.js",
  "extensions/js/df/table.js",
  "extensions/js/df/statistic.js",
  "extensions/js/df/user.js",
  "extensions/js/df/perfectGames.js",
  
  //tracking
  "extensions/js/df/ga.js"
];
// Note: This is required for building with node.js
if (typeof(window) == "undefined" && exports) { exports.dependencies = dependencies; }

