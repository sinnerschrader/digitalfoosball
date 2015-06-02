#!/bin/bash

cp -af "service.sh" "/etc/init.d/robofoos"
cp -rf robofoos /opt/
update-rc.d "robofoos" defaults
service "robofoos" start
