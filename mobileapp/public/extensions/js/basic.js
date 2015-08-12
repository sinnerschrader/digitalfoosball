/**
 * Loading configuration starts here
 * Path will be prefixed with baseURL
 */
var dependencies = [
  "extensions/js/ext/zepto.js",
  "extensions/js/ext/socket.io.js",
  
  "extensions/js/df/df.js",
  "extensions/js/df/socket.js",
  "extensions/js/df/app.js",
  "extensions/js/df/scoreboard.js",
  "extensions/js/df/summary.js",
  "extensions/js/df/dialog.js",
  "extensions/js/df/status.js",

  //development
  "extensions/js/df/dev.js",

  //tracking
  "extensions/js/df/ga.js"
];
// Note: This is required for building with node.js
if (typeof(window) == "undefined" && exports) { exports.dependencies = dependencies; }

