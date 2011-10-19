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
byte ETHERNET_MAC[] = {0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED};

// ETHERNET only: IP address, gateway, and subnet mask (must be assigned manually)
// Example: {192, 168, 0, 177}, {192, 168, 0, 1}, {255, 255, 0, 0}
byte ETHERNET_IP[] = {192, 168, 0, 177};
byte ETHERNET_GATEWAY[] = {192, 168, 0, 1};
byte ETHERNET_SUBNET[] = {255, 255, 0, 0};

// WIFLY only: Wifi SSID
// Example: "mywifi"
char WIFLY_SSID[] = "mywifi";

// WIFLY only: WPA passphrase (sorry, no spaces supported yet)
// Example: "secret-passphrase"
char WIFLY_PASSPHRASE[] = "secret-passphrase";

// Configure server name and server IP (no DNS to reduce lag)
// Example: "www.example.org" and {192, 0, 43, 10}
char SERVER_NAME[] = "www.example.org";
byte SERVER_IP[] = {192, 0, 43, 10};

// Configure context path (application base path), leave empty (not slash) for root
// Examples: "/mypath", ""
char CONTEXT[] = "";


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
#define DEBUG_APP


/*******************************
 ***  CONSTANTS AND GLOBALS  ***
 *******************************/

// Pin constants
const int GOAL_A_PIN = 2;
const int GOAL_B_PIN = 4;
const int RESET_A_PIN = 3;
const int RESET_B_PIN = 5;
const int LED_PIN = 8; // Standard LED pin 13 used by Spi

// Uniqueness token, initialized by random, auto-incrementing
unsigned long token;

#if defined(INTERNET_ETHERNET) || defined(INTERNET_WIFLY)
	// The client for communication with goal server
	Client client(SERVER_IP, 80);
#endif

// Whether we think we have associated/connected
boolean associated = false;
boolean connected = false;
int failures = 0;

// Debugging
#ifdef DEBUG_APP
	#define LOG(message) Serial.print(message)
#else
	#define LOG(message) (((0)))
#endif


/**************************
 ***  HELPER FUNCTIONS  ***
 **************************/

void disconnect()
{
	#if defined(INTERNET_ETHERNET)
		client.stop();
		client = Client(SERVER_IP, 80);
		Ethernet.begin(ETHERNET_MAC, ETHERNET_IP, ETHERNET_GATEWAY, ETHERNET_SUBNET);
		delay(1000);
	#elif defined(INTERNET_WIFLY)
		client.disconnect();
	#endif

	connected = false;
}

boolean ensureConnection(boolean checkWiFlyStatus)
{
	#if defined(INTERNET_ETHERNET)
		if (!client.connected())
		{
			if (connected)
				LOG("Connection LOST, reconnecting...\n");
			else
				LOG("Preconnecting to server...\n");

			client.stop();
			client = Client(SERVER_IP, 80);
			Ethernet.begin(ETHERNET_MAC, ETHERNET_IP, ETHERNET_GATEWAY, ETHERNET_SUBNET);
			delay(1000);

			if (!client.connect())
			{
				LOG("Connection FAILED, trying again later.\n");
				flashError(1);
				return false;
			}

			if (!client.connected())
			{
				LOG("Connection FAILED, trying again later.\n");
				flashError(2);
				return false;
			}

			LOG("Connected.\n");
			connected = true;
		}
	#elif defined(INTERNET_WIFLY)
		WiFlyDevice::Status status = checkWiFlyStatus ? wiFly.getStatus(false) : WiFlyDevice::StatusConnected;
		if (status == WiFlyDevice::StatusError || status == WiFlyDevice::StatusNotAssociated
			|| status == WiFlyDevice::StatusNoIp)
		{
			if (associated)
			{
				if (status == WiFlyDevice::StatusNotAssociated)
					LOG("ERROR: Association LOST, resetting...\n");
				else if (status == WiFlyDevice::StatusNoIp)
					LOG("ERROR: No WiFi IP, resetting...\n");
				else
					LOG("ERROR: WiFi problem, resetting...\n");

				reset();
			}

			LOG("Joining network...\n");
			if (!wiFly.join(WIFLY_SSID, WIFLY_PASSPHRASE))
			{
				LOG("ERROR: Joining network failed, trying again later.\n");
				flashError(1);

				if (failures++ >= 3)
				{
					LOG("ERROR: Three failures, resetting.\n");
					reset();
				}

				return false;
			}

			LOG("Network joined.\n");
			associated = true;
			connected = false;
			failures = 0;
		}

		status = checkWiFlyStatus ? wiFly.getStatus(false) : WiFlyDevice::StatusConnected;
		if (!client.isConnected() || status != WiFlyDevice::StatusConnected)
		{
			if (connected)
				LOG("Connection LOST, reconnecting...\n");
			else
				LOG("Preconnecting to server...\n");

			if (!client.connect(false) || !client.isConnected())
			{
				LOG("Connection FAILED, trying again later.\n");
				flashError(2);

				if (failures++ >= 3)
				{
					LOG("ERROR: Three failures, resetting.\n");
					reset();
				}

				return false;
			}

			LOG("Connected.\n");
			connected = true;
		failures = 0;
		}

		delay(250);
	#endif

	return true;
}

#ifdef INTERNET_ETHERNET
	boolean findInEthernetResponse(const char * toMatch, unsigned int timeOut)
	{
		int byteRead;
		unsigned long timeOutTarget;
		for (unsigned int offset = 0; offset < strlen(toMatch); offset++)
		{
			timeOutTarget = millis() + timeOut;
	
			while (!client.available())
			{
				if (millis() > timeOutTarget)
					return false;
	
				//delay(1);
			}
	
			byteRead = client.read();
			if (byteRead != toMatch[offset])
			{
				offset = 0;
				if (byteRead != toMatch[offset])
					offset = -1;
	
				continue;
			}
		}
	
		return true;
	}
#endif

void flashError(int errorNo)
{
	int i;
	for (int i=0; i<8; i++)
	{
		digitalWrite(LED_PIN, HIGH);
		delay(100);
		digitalWrite(LED_PIN, LOW);
		delay(100);
	}

	delay(500);

	for (int i=0; i<errorNo; i++)
	{
		digitalWrite(LED_PIN, HIGH);
		delay(500);
		digitalWrite(LED_PIN, LOW);
		delay(500);
	}

	delay(500);
}

void reset()
{
	associated = false;
	connected = false;

	#if defined(INTERNET_ETHERNET)
		client.stop();
		client = Client(SERVER_IP, 80);
		Ethernet.begin(ETHERNET_MAC, ETHERNET_IP, ETHERNET_GATEWAY, ETHERNET_SUBNET);
		delay(1000);
	#elif defined(INTERNET_WIFLY)
		wiFly.begin();
	#endif

	failures = 0;
}


/*****************************
 ***  Setup and main loop  ***
 *****************************/

void setup()
{
	Serial.begin(9600);
	LOG("Initializing...\n");

	pinMode(GOAL_A_PIN, INPUT);
	pinMode(GOAL_B_PIN, INPUT);
	pinMode(RESET_A_PIN, OUTPUT);
	pinMode(RESET_B_PIN, OUTPUT);
	pinMode(LED_PIN, OUTPUT);

	digitalWrite(GOAL_A_PIN, LOW);
	digitalWrite(GOAL_B_PIN, LOW);
	digitalWrite(RESET_A_PIN, LOW);
	digitalWrite(RESET_B_PIN, LOW);

	for (int i=0; i<10; i++)
	{
		digitalWrite(LED_PIN, LOW);
		delay(50);
		digitalWrite(LED_PIN, HIGH);
		delay(50);
	}

	randomSeed(analogRead(0));
	token = random(65535);

	#ifdef INTERNET_WIFLY
		wiFly.begin();

		while (!ensureConnection(true))
			delay(1000);
	#endif

	digitalWrite(RESET_A_PIN, HIGH);
	digitalWrite(RESET_B_PIN, HIGH);
	delay(10);
	digitalWrite(RESET_A_PIN, LOW);
	digitalWrite(RESET_B_PIN, LOW);
	delay(10);

	digitalWrite(LED_PIN, LOW);
	LOG("Initialization done.\n");
}

void loop()
{
	char string[512];

	// Analyze inputs until we find a goal (HIGH is true)
	// Also check that we are still connected to the server and access point

	int playerPin = GOAL_A_PIN;
	long checkCount = 0;
	while (true)
	{
		playerPin = playerPin == GOAL_A_PIN ? GOAL_B_PIN : GOAL_A_PIN;
		if (digitalRead(playerPin) == HIGH)
			break;

		if ((checkCount % 200) == 0)
			while (!ensureConnection(checkCount == 0))
				delay(5000);

		delay(10);
		checkCount = (checkCount + 1) % 2000;
	}

	digitalWrite(LED_PIN, HIGH);
	#ifdef DEBUG_APP
		sprintf(string, "Goal for %s team, ID %lu\n", playerPin == GOAL_A_PIN ? "home" : "visitors", token);
		LOG(string);
	#endif

	// Retry at most 3 times

	boolean success = false;
	while (!success && failures < 3)
	{
		while (!ensureConnection(false))
			delay(1000);

		// Send a POST to the goal server

		char content[128];
		sprintf(content, "token=%lu&table=%s", token, TABLE_ID);
		sprintf(string, "POST %s/events/goals/%s HTTP/1.1\r\n"
		"Host: %s\r\n"
			"User-Agent: Arduino/DigitalerKicker\r\n"
			"Content-Type: application/x-www-form-urlencoded\r\n"
			"Content-Length: %d\r\n\r\n%s", CONTEXT,
			playerPin == GOAL_A_PIN ? "home" : "visitors", SERVER_NAME,
			strlen(content), content);

		LOG("Sending request...\n");
		LOG(string);
		LOG("\n");
		#if defined(INTERNET_ETHERNET) || defined(INTERNET_WIFLY)
			client.print(string);
		#endif

		LOG("Request done, checking response...\n");
		#if defined(INTERNET_ETHERNET)
			success = findInEthernetResponse("200 OK", 5000);
		#elif defined(INTERNET_WIFLY)
			success = wiFly.findInResponse("200 OK", 5000);
		#else
			delay(500);
			success = true;
		#endif

		if (success)
		{
			LOG("Request successful.\n");
			failures = 0;
		}
		else
		{
			LOG("Request FAILED.\n");
			failures++;

			disconnect();
		}
	}

	token++;

	if (!success)
	{
		LOG("Giving up and resetting...\n");

		reset();
		ensureConnection(true);
	}

	// Reset goal flip-flop and wait for input to be false (LOW) again
	do
	{
		digitalWrite(playerPin == GOAL_A_PIN ? RESET_A_PIN : RESET_B_PIN, HIGH);
		delay(10);
		digitalWrite(playerPin == GOAL_A_PIN ? RESET_A_PIN : RESET_B_PIN, LOW);
		delay(10);
	}
	while (digitalRead(playerPin) != LOW);

	digitalWrite(LED_PIN, LOW);

	// Disconnect and preconnect again

	if (success)
	{
		disconnect();
		ensureConnection(false);
	}

	LOG("Ready for next goal.\n");
}
