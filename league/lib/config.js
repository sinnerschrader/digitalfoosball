var fs = require("fs");

exports.config = (function() {
  var configfiles = {
    base : __dirname+"/config.json"
  },
  config,
  reader;

  for (var file in configfiles) {
    reader = fs.readFileSync(configfiles[file]);
    if (!reader) {
      throw new Error("Couldn't read config file " + configfiles[file]);
    }

    if (!config) {
      config = JSON.parse(reader);
    } else {
      var more = JSON.parse(reader);
      for (var key in more) {
        config[key] = more[key];
      }
    }
  }
  return config;
})();

