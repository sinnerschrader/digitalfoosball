## Part two: Mobile Webapp ##

See [Wiki](https://github.com/sinnerschrader/digitalfoosball/wiki/Installation-Instructions:-Part-2:-Mobile-Webapp) for installation help.

## Talking to Mobile Webapp ##
Certain commands are supported via rest calls to the webapp. Examples given with curl. Replace `$HOST` with connection info for your mobileapp. Ex: `http://localhost:3000`
### new game ###
Creates a new game (disrupting any game in progress)
Must have >1 && <3 players for each side.

`curl -X POST $HOST/events/newgame?home=name1&home=name2&visitors=name3&visitors=name4`
### goals ###
Add a goal to either side

`curl -X POST $HOST/events/goals/home`

`curl -X POST $HOST/events/goals/visitors`
### undo ###
Remove a goal from either side

`curl -X POST $HOST/events/undo/home`

`curl -X POST $HOST/events/undo/visitors`
### abort ###
Cancel game in progress

`curl -X POST $HOST/events/abort`
