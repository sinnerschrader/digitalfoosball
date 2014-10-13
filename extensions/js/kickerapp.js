(function($) {
	$("html").addClass("js").removeClass("no-js");

	/**
	 * SiteCatalyst link tracking
	 */
	var delayScTracking = false; // set true at the end of smooth scrolling => event will be fired after animation then
	var scTrackLink = function($link) {
		if (typeof s_gi !== "undefined") {
			var s = s || s_gi('sschraderprod');
			s.linkTrackVars = '';
			s.linkTrackEvents = '';
			s.tl(this, 'o', 'DF:' + $link.text());
		}
	}

	/**
	 * Smooth scrolling and navigation
	 */
	if (!!$(".js_section").length && !($.browser.msie && $.browser.version < 8)) {
		// IE7 doesn't handle scroll/element positions well => kick it

		var sections = $(".js_section"),
			scrollTimer,
			offsetTolerance = 200,
			$page = $("html, body"),
			logoTop = $(".header h1 a").offset().top,
			mainnavTop = $(".main.nav").offset().top,
			addthisTop = $(".addthis_toolbox").offset().top;

		delayScTracking = true;

		var repositionNav = function() {
			if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/webOS/i)) {
				var scrollTop = $("html").scrollTop() || $("body").scrollTop();
				$(".header h1 a").css("top", scrollTop + logoTop);
				$(".main.nav").css("top", scrollTop + mainnavTop);
				$(".addthis_toolbox").css("top", scrollTop + addthisTop);
			}
		}

		// rewrite IDs so hashchange doesn't cause page jumping
		sections.each(function() {
			$(this).attr("id", $(this).attr("id") + "_target");
		});

		$("#js_nav a").bind("click jumpToSection highlightSection", function(e) {
			var $this = $(this),
				hash = $this.attr("href"),
				target = hash + "_target";

			e.preventDefault();
			$this.blur();

			$("#js_nav a").removeClass("active");
			$this.addClass("active");
			sections.removeClass("active");
			$(target).addClass("active");

			if (e.type == "click") {
				window.location.hash = hash;
				// scroll to section with animation
				$page.stop().animate({scrollTop: $(target).offset().top}, "slow", "swing", function() {
					if (this.nodeName.toLowerCase() == "body") { // fire callback only once
						repositionNav();
						scTrackLink($this);
					}
				});
			} else if (e.type == "jumpToSection") {
				// scroll to section immediately
				$(target).get(0).scrollIntoView();
			}
		});

		// listen to scrolling and adjust navigation
		$(window).scroll(function() {
			clearTimeout(scrollTimer);

			scrollTimer = setTimeout(function() {
				var scrollTop = $("html").scrollTop() || $("body").scrollTop();

				sections.each(function() {
					var $this = $(this);
					// if a section starts at least 200px (offsetTolerance) below scrollTop, we consider it as currently viewed
					if ($this.offset().top <= scrollTop + offsetTolerance) {
						// skip all sections farther above, then highlight the remaining one
						if ($this.next(".js_section").length && $this.next(".js_section").offset().top < scrollTop + offsetTolerance) return;
						$("#js_nav a[href=#" + $this.attr("id").replace("_target", "") + "]").trigger("highlightSection");
					} else if (sections.offset().top > scrollTop) {
						// if the first found section starts below scrollTop, we are at the first position
						$("#js_nav li:first-child a").trigger("highlightSection");
					}
				});
				repositionNav();
			}, 100);
		});

		$(window).bind("hashchange", function() {
			$("#js_nav a[href=" + window.location.hash + "]").trigger("jumpToSection");
			if (!window.location.hash) document.body.scrollIntoView();
			repositionNav();
		});

		// allow deeplinking to sections
		if (!!window.location.hash) {
			$("#js_nav a[href=" + window.location.hash + "]").trigger("jumpToSection");
			repositionNav();
		} else {
			$("#js_nav li:first-child a").trigger("highlightSection");
		}

		delayScTracking = true;
	}

	/**
	 * SiteCatalyst Tracking for imprint page
	 */
	if(!!("#js_nav").length && !delayScTracking) {
		$("#js_nav a").click(function() {
			scTrackLink($(this));
		});
	}

})(window.jQuery);
