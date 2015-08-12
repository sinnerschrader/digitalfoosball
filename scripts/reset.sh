#!/bin/bash

#This script deletes and recreates the couch DB foosball document, re-deploys the leage page, and restarts services

#If using user/pass modify: http://<user>:<pass>@localhost:5984
export COUCH="http://localhost:5984"
#Base dir
export DIR="/opt/digitalfoosball"

curl -X DELETE "$COUCH/digitalfoosball"
curl -X PUT "$COUCH/digitalfoosball"

cd "$DIR/league"
soca push -c config.soca.json

cd "$DIR/scripts"
./startAll.sh
