#!/bin/bash

NODE_BIN=/usr/local/bin/node
SCRIPT_NAME=`which $0`
SCRIPT_PATH=`dirname $SCRIPT_NAME`
CALC_BIN=$SCRIPT_PATH/calc.js

case "$1" in

    start)
	echo "Starting nodejs for league calculation..."
	$NODE_BIN $CALC_BIN  >> /var/log/node_calc.log 2>&1 &
	echo "$!" > /var/run/node_calc.pid
	;;
    stop)
	echo "Stoping nodejs for league calculation..."
	kill `cat /var/run/node_calc.pid`
	;;
    default)
	echo "Usage $0 {start|stop}"
	;;
esac
