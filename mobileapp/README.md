## Part two: Mobile Webapp ##

See [Wiki](https://github.com/sinnerschrader/digitalfoosball/wiki/Installation-Instructions:-Part-2:-Mobile-Webapp) for installation help.

## Talking to Mobile Webapp ##
Certain commands are supported via rest calls to the webapp. Examples given with curl. Replace `$HOST` with connection info for your mobileapp. Ex: `http://localhost:3000`
### add player ###
Currently, exactly 4 players are expected (no support yet for 2)  
Players are mached in CouchDB by their RFID tag ID  
Call this API by RFID ID and player will be added by their CouchDB ID  
`curl -X POST http://foosbot.mt.sri.com:3000/events/addplayer/visitors?id=0009653896`  
After 4 players are matched, a new game will automatically start  
If a game is already in progress, adding 4 players will do nothing  
### goals ###
Add a goal to either side  
`curl -X POST $HOST/events/goals/home`  
`curl -X POST $HOST/events/goals/visitors`  
### undo ###
Remove a goal from either side
`curl -X POST $HOST/events/undo/home`  
`curl -X POST $HOST/events/undo/visitors`  
### penalty ###
Remove latest goal from either side, apply a -1 penalty to the reporting side  
This is a house rule that allows penalties to be applied for whatever arbitrary reason  
rules.json sets the minimum score value (default is 0)  
`curl -X POST $HOST/events/penalty/home`  
`curl -X POST $HOST/events/penalty/visitors`  
### abort ###
Cancel game in progress  
`curl -X POST $HOST/events/abort`  
### kick the dog ###
Send a ping to the front-end to help debug offline raspberry  
`curl -X POST http://foosbot.mt.sri.com:3000/events/*kick*`
ex:
`curl -X POST http://foosbot.mt.sri.com:3000/events/kickthedog`
