df.app = (function() {
  var $content = $("#content"),
      $nav = $("#mainnav"),
      $activeNav;

  var navigate = function(path, content) {
    var $replace = $content;
    $content = $(content);
    $replace.replaceWith($content);
    
    $activeNav && $activeNav.removeClass("active");
    $activeNav = $nav.find("a[href='" + path.replace(/^(#!\/[^\/]+).*$/, "$1") + "']");
    $activeNav.addClass("active");

    window.scrollTo(0,0);

    df.ga.track(path.replace(/^#!(.*)$/, "$1"));

    return $content;
  };

  var app = $.sammy("#container", function() {
    this.route("get", "#!/live", function() {
      var self = this;
      $.get("live", function(partial) {
        partial = navigate(self.path, partial);
        df.publish("app:live", partial);
      });
    });

    this.route("get", "#!/table", function() {
      var self = this;
    	$.get("table", function(partial) {
        partial = navigate(self.path, partial);
        df.publish("app:table", partial);
      });
    });

    this.route("get", "#!/statistic", function() {
      var self = this;
   	  $.get("statistic", function(partial) {
   		  partial = navigate(self.path, partial);
        df.publish("app:statistic", partial);
      });
    });

    this.route("get", "#!/perfectGames", function() {
      var self = this;
      $.get("perfectGames", function(partial) {
        partial = navigate(self.path, partial);
        df.publish("app:perfectGames", partial);
      });
    });

    this.route("get", "#!/statistic/:name", function() {
      var self = this;
      $.get("statistic/" + this.params["name"], function(partial) {
        partial = navigate(self.path, partial);
        df.publish("app:user", partial);
      });
    });

    this.route("get", "#!/guide", function() {
      var self = this;
    	$.get("guide", function(partial) {
        partial = navigate(self.path, partial);
        df.publish("app:guide", partial);
      });
    });

    this.route("get", "#!/tos", function() {
      var self = this;
    	$.get("tos", function(partial) {
        partial = navigate(self.path, partial);
        df.publish("app:tos", partial);
      });
    });
  });

  df.subscribe("ready", function() {
    app.run("#!/live");
  });

  $(".js_target").live("click",function(e) {
    e.preventDefault();
    window.open($(this).attr('href'),($(this).attr('data-target') || "_blank"))
  });

  return {};
})();

