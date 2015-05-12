#!/usr/bin/env python

import RPi.GPIO as GPIO
import time, traceback, sys
import requests
import threading
import usb.core
from multiprocessing import Process
from keyboard_alike import reader

SERVER_URL = "http://foosbot.mt.sri.com:3000"
BUTTON_ABORT_TIME = 5.0
BUTTON_DOUBLE_PRESS_WINDOW = 1.0

GOAL_HOME_GPIO = 13
GOAL_VISITORS_GPIO = 19

BUTTON_HOME_GPIO = 12
BUTTON_VISITORS_GPIO = 16

button_home_press = 0.0
button_home_timer = None
button_visitors_press = 0.0
button_visitors_timer = None

def main():
    home_rfid = Process(target=rfid_reader_proc, args=("home",))
    home_rfid.start()
    visitors_rfid = Process(target=rfid_reader_proc, args=("visitors",))
    visitors_rfid.start()
    
    try:
        #set up GPIO using BCM numbering
        GPIO.setmode(GPIO.BCM)

        # Button Switch Pins
        GPIO.setup(BUTTON_HOME_GPIO, GPIO.IN, pull_up_down=GPIO.PUD_DOWN);
        GPIO.add_event_detect(BUTTON_HOME_GPIO, GPIO.BOTH, callback=button, bouncetime=100)
        GPIO.setup(BUTTON_VISITORS_GPIO, GPIO.IN, pull_up_down=GPIO.PUD_DOWN);
        GPIO.add_event_detect(BUTTON_VISITORS_GPIO, GPIO.BOTH, callback=button, bouncetime=100)

        # IR Sensor Switch Pins - Pull Up since switch goes to ground when triggered
        GPIO.setup(GOAL_HOME_GPIO, GPIO.IN, pull_up_down=GPIO.PUD_UP);
        GPIO.add_event_detect(GOAL_HOME_GPIO, GPIO.FALLING, callback=goal, bouncetime=300)
        GPIO.setup(GOAL_VISITORS_GPIO, GPIO.IN, pull_up_down=GPIO.PUD_UP);
        GPIO.add_event_detect(GOAL_VISITORS_GPIO, GPIO.FALLING, callback=goal, bouncetime=300)

        while True:
            # TODO: Kick dog via rest API here
            time.sleep(1)

    except KeyboardInterrupt:
        pass
    
    except:
        traceback.print_exc()
        sys.stderr.flush()

    finally:
        print "Cleanup"
        GPIO.cleanup()
        home_rfid.join()
        visitors_rfid.join()

class RFIDReader(reader.Reader):
    """
    This class supports common black RFID Readers for 125 kHz read only tokens
    http://www.dx.com/p/intelligent-id-card-usb-reader-174455
    """
    pass

def rfid_reader_proc(side):
    try:
        # find RFID USB devices
        devices = tuple(usb.core.find(find_all=True, idVendor=0x08ff, idProduct=0x0009))
        if (len(devices) != 2):
            print "Both RFID Readers are not found!"
            raise RuntimeError
        if (side == "home"):
            device = devices[0] if (devices[0].address < devices[1].address) else devices[1]
        else:
            device = devices[1] if (devices[0].address < devices[1].address) else devices[0]
    
        reader = RFIDReader(0x08ff, 0x0009, 84, 16, should_reset=False, debug=False, device=device)
        reader.initialize()

        while True:
            id = reader.read().strip()
            print(side + " " + id)
            r = requests.post(SERVER_URL + "/events/addplayer/" + side, {'id' :id} )
            print r.text
            
    except KeyboardInterrupt:
        pass


def goal(channel):
    side = "home" if channel == GOAL_HOME_GPIO else "visitors"
    r = requests.post(SERVER_URL + "/events/goals/" + side)
    print side + " goal!!!"

def button(channel):
    side = "home" if channel == BUTTON_HOME_GPIO else "visitors"
    if (GPIO.input(channel)):
        button_press(side)
    else:
        button_release(side)

def button_press(side):
    #print side + " button press"
    if (globals()["button_" + side + "_press"] == 0.0):
        globals()["button_" + side + "_press"] = time.time()
    elif ((globals()["button_" + side + "_press"]-time.time()) <= BUTTON_DOUBLE_PRESS_WINDOW):
        # execute double press
        globals()["button_" + side + "_timer"].cancel()
        globals()["button_" + side + "_timer"] = None
        globals()["button_" + side + "_press"] = 0.0
        r = requests.post(SERVER_URL + "/events/undo/" + side)
        print side + " undo!!!"
    else:
        # this is an error state
        globals()["button_" + side + "_press"] = 0.0
        print side + " unknown button state!"


def button_release(side):
    #print side + "button release"
    if ((globals()["button_" + side + "_press"]-time.time()) >= BUTTON_ABORT_TIME):
        # excute abort
        globals()["button_" + side + "_press"] = 0.0
        r = requests.post(SERVER_URL + "/events/abort" + side)
        print side + " abort!!!"
    elif (globals()["button_" + side + "_press"] != 0.0):
        # fire timer for single button press
        globals()["button_" + side + "_timer"] = threading.Timer(BUTTON_DOUBLE_PRESS_WINDOW, penalty, [side])
        globals()["button_" + side + "_timer"].start()

def penalty(side):
    globals()["button_" + side + "_press"] = 0.0
    r = requests.post(SERVER_URL + "/events/penalty/" + side)
    print side + " penalty!!!"

if __name__ == "__main__":
    main()
