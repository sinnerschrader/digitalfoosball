#!/usr/bin/env python

import RPi.GPIO as GPIO
import time, traceback, sys
import requests
import threading
import usb
import usb.core
import math
from collections import namedtuple
from multiprocessing import Process
from keyboard_alike import reader

SERVER_URL = "http://foosbot.mt.sri.com:3000"
BUTTON_ABORT_TIME = 5.0
BUTTON_DOUBLE_PRESS_WINDOW = 1.0

GOAL_HOME_GPIO = 13
GOAL_VISITORS_GPIO = 19

BUTTON_HOME_GPIO = 12
BUTTON_VISITORS_GPIO = 16

PRESSED = "PRESSED"
RELEASED = "RELEASED"
NAN = float('nan')

class InfoData:
    def __init__(self, press_time, timer, status):
        self.press_time = press_time
        self.timer = timer
        self.status = status

button_info = {"home" :    InfoData(NAN, None, RELEASED), 
               "visitors": InfoData(NAN, None, RELEASED)}

def main():
    if usb.__version__ != "1.0.0b1":
        # https://github.com/arvydas/blinkstick-python/wiki/NotImplementedError-is_kernel_driver_active-on-some-Linux-systems
        raise EnvironmentError("PyUSB must be version 1.0.0b1 to function")
    
    home_rfid = Process(target=rfid_reader_proc, args=("home",))
    home_rfid.start()
    visitors_rfid = Process(target=rfid_reader_proc, args=("visitors",))
    visitors_rfid.start()
    
    try:
        #set up GPIO using BCM numbering
        GPIO.setmode(GPIO.BCM)

        # Button Switch Pins
        GPIO.setup(BUTTON_HOME_GPIO, GPIO.IN, pull_up_down=GPIO.PUD_DOWN);
        GPIO.add_event_detect(BUTTON_HOME_GPIO, GPIO.BOTH, callback=button, bouncetime=50)
        GPIO.setup(BUTTON_VISITORS_GPIO, GPIO.IN, pull_up_down=GPIO.PUD_DOWN);
        GPIO.add_event_detect(BUTTON_VISITORS_GPIO, GPIO.BOTH, callback=button, bouncetime=50)

        # IR Sensor Switch Pins - Pull Up since switch goes to ground when triggered
        GPIO.setup(GOAL_HOME_GPIO, GPIO.IN, pull_up_down=GPIO.PUD_UP);
        GPIO.add_event_detect(GOAL_HOME_GPIO, GPIO.FALLING, callback=goal, bouncetime=1000)
        GPIO.setup(GOAL_VISITORS_GPIO, GPIO.IN, pull_up_down=GPIO.PUD_UP);
        GPIO.add_event_detect(GOAL_VISITORS_GPIO, GPIO.FALLING, callback=goal, bouncetime=1000)

        while True:
            try:
                time.sleep(30)
                r = requests.post(SERVER_URL + "/events/kickthedog")
            except Exception:
                sys.stderr.write("WARNIGN: Unable to contact server to kick the dog\n")


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
            r = requests.post(SERVER_URL + "/events/addplayer/" + side, params={'id' :id} )
            print r.text
            
    except KeyboardInterrupt:
        pass


def goal(channel):
    side = "home" if channel == GOAL_HOME_GPIO else "visitors"
    print side + " goal!!!"
    r = requests.post(SERVER_URL + "/events/goals/" + side)

def button(channel):
    side = "home" if channel == BUTTON_HOME_GPIO else "visitors"
    if (GPIO.input(channel) and button_info[side].status is RELEASED):
        button_press(side)
        while (GPIO.input(channel)):
            if ((time.time() - button_info[side].press_time) >= BUTTON_ABORT_TIME):
                # excute abort
                button_info[side].press_time = NAN
                print side + " abort!!!"
                r = requests.post(SERVER_URL + "/events/abort" + side)
                break
    elif button_info[side].status is PRESSED:
        button_release(side)

def button_press(side):
    print side + " button press"
    button_info[side].status = PRESSED
    if (math.isnan(button_info[side].press_time)):
        button_info[side].press_time = time.time()
    elif ((time.time() - button_info[side].press_time) <= BUTTON_DOUBLE_PRESS_WINDOW):
        # execute double press
        button_info[side].timer.cancel()
        button_info[side].timer = None
        button_info[side].press_time = NAN
        print side + " undo!!!"
        r = requests.post(SERVER_URL + "/events/undo/" + side)
    else:
        # this is an error state
        button_info[side].press_time = NAN
        print side + " unknown button state!"


def button_release(side):
    print side + "button release"
    button_info[side].status = RELEASED
    if (not math.isnan(button_info[side].press_time)):
        # fire timer for single button press
        button_info[side].timer = threading.Timer(BUTTON_DOUBLE_PRESS_WINDOW, penalty, [side])
        button_info[side].timer.start()

def penalty(side):
    button_info[side].press_time = NAN
    print side + " penalty!!!"
    r = requests.post(SERVER_URL + "/events/penalty/" + side)

if __name__ == "__main__":
    main()
