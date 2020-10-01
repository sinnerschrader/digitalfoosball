# Digital Foosball # digital 

Bringing the analog foosball table into the digital age.

---
This is german engineering, so please read all instructions carefully. :-)


## Background ##
Because the web is our DNA, we're using Web-Technologies to get it online. We also want to make usage of the latest and greatest HTML5/CSS3/JavaScript technologies to show what's possible today. We're using this project as a Technology-Demo.

Of course is our Agency Foosball Table also powered by this software and it's daily used by dozens of people - and ourselves. So we make sure it's always usable and fun...


## Which modules are included ##

### Arduino ###
Hardware mounted to the foosball table, including light barriers und an Arduino board with Wifi shield.
See our [Wiki](https://github.com/sinnerschrader/digitalfoosball/wiki/Installation-Instructions:-Part-1:-Hardware) where we explain the first part, how to turn an analog foosball table into a digital one, sending HTTP POSTs on every goal.

### HTML5 Mobile Webapp with app server ###
The mobile Webapp to start and stop the games and follow the score. It also includes the web server which sends the game events to the CouchDB and Twitter.
Look at the included readme file and our [Wiki](https://github.com/sinnerschrader/digitalfoosball/wiki/Installation-Instructions:-Part-2:-Mobile-Webapp) for installation help.

### HTML5 CouchApp (League) ###
The website which displays the game feeds, league and statistics.
Look at the included readme file and our [Wiki](https://github.com/sinnerschrader/digitalfoosball/wiki/Installation-Instructions:-Part-3:-League-CouchApp) for installation help.

## Q&A ##

### Which platform do you support? ###
To work with bleeding edge technologies, we have chosen Webkit-based Browsers as developing target. It has the widest support of HTML5 and CSS3 standards and it's available on many platforms (Chrome, Safari and Android, iOS). Additionally it's rendering and developing super fast.

### What about other current browsers? ###
We have used vendor extensions for HTML5/CSS3 draft features. So if other engines implement these feature too, it will work like a charm. We won't do further support to keep the code as sleek and fast as possible.

### Will you add support for older browsers? ###
Nope. And we won't add it at all.

### Which Browser do you recommend? ###
The developers are Apple Fanboys, so we recommend newest Safari and iPhone. :-)

### Is there more help? ###
Checkout the [Wiki](https://github.com/sinnerschrader/digitalfoosball/wiki)

### I want to contribute ###
That's great. Before you start coding, just send us a message with your plan. We have already a feature roadmap in mind. See also the Wiki-Page of [Upcoming Features](https://github.com/sinnerschrader/digitalfoosball/wiki/Upcoming-Features). This should avoid double coding...

### I'd like to connect it to Skynet ###
That's fine for us.

### Licence ###
See `LICENSE` file in each of the application folders.

---
You've read all instructions? Well done.
Viel Spaß mit dem Projekt.
