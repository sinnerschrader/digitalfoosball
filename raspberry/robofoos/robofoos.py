#!/usr/bin/env python

import RPi.GPIO as GPIO
import time, traceback, sys
import requests

def main():
    try:
        #set up GPIO using BCM numbering
        GPIO.setmode(GPIO.BCM)

        # IR Sensor Switch Pins - Pull Up since switch goes to ground when triggered
        GPIO.setup(12, GPIO.IN, pull_up_down=GPIO.PUD_DOWN);
        GPIO.add_event_detect(12, GPIO.RISING, callback=homeUndo, bouncetime=300)
        GPIO.setup(16, GPIO.IN, pull_up_down=GPIO.PUD_DOWN);
        GPIO.add_event_detect(16, GPIO.RISING, callback=visitorsUndo, bouncetime=300)

        # IR Sensor Switch Pins - Pull Up since switch goes to ground when triggered
        GPIO.setup(13, GPIO.IN, pull_up_down=GPIO.PUD_UP);
        GPIO.add_event_detect(13, GPIO.FALLING, callback=homeGoal, bouncetime=300)
        GPIO.setup(19, GPIO.IN, pull_up_down=GPIO.PUD_UP);
        GPIO.add_event_detect(19, GPIO.FALLING, callback=visitorsGoal, bouncetime=300)

        while True:
            # TODO: Kick dog via rest API here
            #print("alive")
            #print GPIO.input(13)
            time.sleep(1)

    except KeyboardInterrupt:
        pass
    
    except:
        traceback.print_exc()
        sys.stderr.flush()

    finally:
        print "Cleanup"
        GPIO.cleanup()

def homeGoal(channel):
    r = requests.post("http://foosbot.mt.sri.com:3000/events/goals/home")
    print "HOME Goal!!!"

def homeUndo(channel):
    r = requests.post("http://foosbot.mt.sri.com:3000/events/undo/home")
    print "HOME Undo!!!"

def visitorsGoal(channel):
    r = requests.post("http://foosbot.mt.sri.com:3000/events/goals/visitors")
    print "VISITORS Goal!!!"

def visitorsUndo(channel):
    r = requests.post("http://foosbot.mt.sri.com:3000/events/undo/visitors")
    print "VISITORS Undo!!!"



if __name__ == "__main__":
    main()
