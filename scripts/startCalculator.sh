#!/bin/bash

#Base dir
export DIR="/opt/digitalfoosball"

cd "$DIR/league/lib"

sudo ./init_calc.bash stop
sudo ./init_calc.bash start

