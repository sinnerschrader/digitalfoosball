#!/bin/bash

#Base dir
export DIR="/opt/digitalfoosball"

cd "$DIR/mobileapp/lib"

sudo ./startup.bash stop
sudo ./startup.bash start

