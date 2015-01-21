/***********************
 ***  CONFIGURATION  ***
 ***********************/

// Define the table ID here. Table IDs are required if you have multiple tables for one league.
#define TABLE_ID "main"

// Define the Internet connection type, may be:
// - INTERNET_ETHERNET (Arduino Ethernet shield),
// - INTERNET_WIFLY (Sparkfun WiFly shield), or
// - INTERNET_MOCKUP (simulate connection, no actual Internet communication)
// Note: Due to the way the linker detects libraries,
// you must also uncommect one of the library blocks below
#define INTERNET_MOCKUP

// ETHERNET only: Mac address (must be assigned manually, set bit 0 of first byte to 0, and bit 1 to 1)
// Example: {0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED}
unsigned char ETHERNET_MAC[] = {0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED};

// ETHERNET only: IP address, gateway, and subnet mask (must be assigned manually)
// Example: {192, 168, 0, 177}, {192, 168, 0, 1}, {255, 255, 0, 0}
unsigned char ETHERNET_IP[] = {192, 168, 2, 2};
unsigned char ETHERNET_GATEWAY[] = {192, 168, 2, 1};
unsigned char ETHERNET_SUBNET[] = {255, 255, 255, 0};

// WIFLY only: Wifi SSID
// Example: "mywifi"
char WIFLY_SSID[] = "mywifi";

// WIFLY only: WPA passphrase (sorry, no spaces supported yet)
// Example: "secret-passphrase"
char WIFLY_PASSPHRASE[] = "secret-passphrase";

// Configure server name and server IP (no DNS to reduce lag)
// Example: "www.example.org" and {192, 0, 43, 10}
char SERVER_NAME[] = "www.example.org";
unsigned char SERVER_IP[] = {192, 0, 43, 10};

// If the server has a different port, configure it here
int SERVER_PORT = 80;

// Configure context path (application base path), leave empty (not slash) for root
// Examples: "/mypath", ""
char CONTEXT[] = "";

// Pin constants, change if you modified the hardware schematic
#define GOAL_A_PIN 2
#define GOAL_B_PIN 4
#define RESET_A_PIN 3
#define RESET_B_PIN 5
#define RFID_A_PIN 6
#define RFID_B_PIN 7

// Standard LED pin 13 used by Spi
#define LED_PIN 8


/*******************
 ***  LIBRARIES  ***
 *******************/

// Uncomment when using ETHERNET:
//#include "SPI.h"
//#include "Ethernet.h"

// Uncomment when using WIFLY:
// Note that the Digital Foosball table requires a modified version of the WiFly library,
// see the Wiki for details.
//#include "WiFly.h"


/***************************
 ***  DEBUGGING OPTIONS  ***
 ***************************/

// Define to enable output messages on Serial
// Use #define to enable, #undef to disable
#define DEBUG_APP
