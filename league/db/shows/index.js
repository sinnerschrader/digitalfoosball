function(doc, req) {
  var mustache = require("lib/mustache"),
      template = this.templates["index.html"],
      config = this.config,
      locales = JSON.parse(this.resources["locales_" + config.locale + ".json"]);

  var data = {
    production: config.env === "production",
    cdn: config.cdn,
    rev: config.rev,
    config: JSON.stringify(config)
  };

  for (var key in locales) {
    data["locales." + key] = locales[key];
  }

  return {
    body: mustache.to_html(template, data)
  };
};

