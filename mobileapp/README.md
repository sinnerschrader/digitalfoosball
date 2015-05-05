## Part two: Mobile Webapp ##

See [Wiki](https://github.com/sinnerschrader/digitalfoosball/wiki/Installation-Instructions:-Part-2:-Mobile-Webapp) for installation help.

## Talking to Mobile Webapp ##
Certain commands are supported via rest calls to the webapp. Examples given with curl. Replace `$HOST` with connection info for your mobileapp. Ex: `http://localhost:3000`
### new game ###
Creates a new game (disrupting any game in progress)  
To create an unranked game with no named players:  
`curl -X POST $HOST/events/newgame`  
To create a ranked game:  
`curl -X POST $HOST/events/newgame?home=name1&home=name2&visitors=name3&visitors=name4`  
### goals ###
Add a goal to either side  
`curl -X POST $HOST/events/goals/home`  
`curl -X POST $HOST/events/goals/visitors`  
### undo ###
Remove a goal from either side
`curl -X POST $HOST/events/undo/home`  
`curl -X POST $HOST/events/undo/visitors`  
### owngoal ###
Remove latest goal from either side, apply a -1 penalty to the reporting side  
This is a house rule that allows penalties to be applied for whatever arbitrary reason  
rules.json sets the minimum score value (default is 0)  
`curl -X POST $HOST/events/owngoal/home`  
`curl -X POST $HOST/events/owngoal/visitors`  
### abort ###
Cancel game in progress  
`curl -X POST $HOST/events/abort`  
