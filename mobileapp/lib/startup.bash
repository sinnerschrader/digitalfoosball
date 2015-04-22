#!/bin/bash
ENV=development
NODE_BIN=/usr/bin/node
SCRIPT_NAME=`which $0`
SCRIPT_PATH=`dirname $SCRIPT_NAME`
SERVER_BIN=$SCRIPT_PATH/server.js

case "$1" in
    start)
    echo "Starting nodejs for mobile app..."
    NODE_ENV=$ENV $NODE_BIN $SERVER_BIN  >> /var/log/node_mobile_app.log 2>&1 &
    echo "$!" > /var/run/node_mobile_app.pid
    ;;
    stop)
    echo "Stoping nodejs for mobile app..."
    kill `cat /var/run/node_mobile_app.pid`
    ;;
    default)
    echo "Usage $0 {start|stop}"
    ;;
esac
