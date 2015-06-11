# Cybernated Foosball #

Digital Foosball 2.0

---
The goal of this fork is to add raspberry pi support along with other features we want.  We added player tracking via RFID badges and buttons to control how we play.

## Background ##

Head over to [Digital Foosball](https://github.com/sinnerschrader/digitalfoosball/) for background and instructions.

## Raspberry Pi ##

We *were* going to do Arduino, but someone in the office already had a Raspberry on hand, so here we are. All code is in Python using REST to talk to the existing (and added) digitalfoosball/mobileapp node.js endpoints.

## Hardware ##

* Raspberry Pi B+: [Canakit](http://www.amazon.com/CanaKit-Raspberry-Complete-Original-Preloaded/dp/B008XVAVAW)
* Breadboard + breakout: [Eleduino](http://www.amazon.com/Eleduino-Raspberry-Model-T-Cobbler-Breakout/dp/B00NKH9S7Q)
* Goal detection: [Geeetech infrared sensors](http://www.amazon.com/Geeetech-Infrared-proximity-compatible-Arduino/dp/B00AMC1V2C)
* Player detection: [Ebay Chinese 125khz USB RFID Reader](http://www.ebay.com/itm/311140956799)
* Undo/Reset button: [19mm Momentary Push Button Normally Open](http://www.amazon.com/gp/product/B00KDDAJF0)
* RFID cards: [125Khz Cards](http://www.amazon.com/gp/product/B008NGTJJG)
* Level Converter: [Geeetech level converter](http://www.amazon.com/gp/product/B00CI2EK7M)
* Solderable Breadboard: [SB404](http://www.amazon.com/gp/product/B00LLO4Q7W)
* PCB Mount: [5mm screw terminal block](http://www.amazon.com/gp/product/B00EZ3QPCU)
* Pin Header Strip: [Omall 2.54mm] (http://www.amazon.com/gp/product/B00UVPT5RI)

## Schematic ##
![](images/schematic.png?raw=true)
---
See `LICENSE`
