/*************************************
 ***  CONFIGURATION AND LIBRARIES  ***
 *************************************/

// Change settings and used libraries in the config file
// Use the example config file as a template
#include "DigitalFoosball_config.h"


/*******************
 ***  LIBRARIES  ***
 *******************/

// Uncomment when using ETHERNET:
//#include "SPI.h"
//#include "Ethernet.h"


// Uncomment when using WIFLY:
// Note that the Digital Foosball table requires a modified version of the WiFly library,
// see the Wiki for details.
#include "WiFly.h"


/****************
 ***  CHECKS  ***
 ****************/

#if defined(INTERNET_ETHERNET) && !defined(ethernet_h)
	#error FATAL: When defining INTERNET_ETHERNET, uncomment the ethernet includes above
	#error The following errors are only consequential errors...
#endif
#if defined(INTERNET_WIFLY) && !defined(__WIFLY_H__)
	#error FATAL: When defining INTERNET_WIFLY, uncomment the wifly includes above
	#error The following errors are only consequential errors...
#endif


/*****************
 ***  GLOBALS  ***
 *****************/

// Uniqueness token, initialized by random, auto-incrementing
unsigned long token;

#if defined(INTERNET_ETHERNET) || defined(INTERNET_WIFLY)
	// The client for communication with goal server
	Client client(SERVER_IP, SERVER_PORT);
#endif

// Whether we think we have associated/connected
boolean associated = false;
boolean connected = false;
int failures = 0;
long checkCount = 0;

#if defined(RFID_A_PIN) && defined(RFID_B_PIN)
	// RFID buffers
	char rfidABuffer[11];
	int rfidAPos;
	char rfidALastBuffer[11];
	char rfidBBuffer[11];
	int rfidBPos;
	char rfidBLastBuffer[11];

	// The RFID serial bit delay (inverted baud rate minus clock cycles)
	long rfidBitDelay;
#endif

// Debugging
#ifdef DEBUG_APP
	#define LOG(message) (Serial.print(message), delay(500))
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
		client = Client(SERVER_IP, SERVER_PORT);
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
			client = Client(SERVER_IP, SERVER_PORT);
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

				resetNetwork();
			}

			LOG("Joining network...\n");
			if (!wiFly.join(WIFLY_SSID, WIFLY_PASSPHRASE))
			{
				LOG("ERROR: Joining network failed, trying again later.\n");
				flashError(1);

				if (failures++ >= 3)
				{
					LOG("ERROR: Three failures, resetting.\n");
					resetNetwork();
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
					resetNetwork();
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

void handleGoal(int goalPin)
{
	char string[512];

	digitalWrite(LED_PIN, HIGH);
	#ifdef DEBUG_APP
		sprintf(string, "Goal for %s team, ID %lu\n", goalPin == GOAL_A_PIN ? "home" : "visitors", token);
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
			goalPin == GOAL_A_PIN ? "home" : "visitors", SERVER_NAME,
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

		resetNetwork();

		#ifdef INTERNET_WIFLY
			ensureConnection(true);
		#endif
	}

	resetGoal(goalPin);

	digitalWrite(LED_PIN, LOW);

	// Disconnect and preconnect again

	if (success)
	{
		disconnect();

		#ifdef INTERNET_WIFLY
			ensureConnection(false);
		#endif
	}

	LOG("Ready for next goal.\n");
}

#if defined(RFID_A_PIN) && defined(RFID_B_PIN)
	bool handleRfid(int pin, char * buffer, int & bufferPos, char * lastBuffer)
	{
		if (digitalRead(pin))
			return false;

		// Confirm that this is a real start bit, not line noise
		if (digitalRead(pin))
			return false;

		// Frame start indicated by a falling edge and low start bit
		// Jump to the middle of the low start bit
		delayMicroseconds(rfidBitDelay / 2 - clockCyclesToMicroseconds(50));

		// Offset of the bit in the byte: from 0 (LSB) to 7 (MSB)
		int value = 0;
		for (int offset = 0; offset < 8; offset++)
		{
			// Jump to middle of next bit
			delayMicroseconds(rfidBitDelay);

			// Read bit
			value |= digitalRead(pin) << offset;
		}

		delayMicroseconds(rfidBitDelay);

		if (value <= 0)
			return false;

		buffer[bufferPos++] = value;

		if (value == 10)
		{
			bufferPos = 0;
			return false;
		}

		if (bufferPos < 9)
			return false;

		buffer[10] = 0;
		bufferPos = 0;

		for (int i=0; i<10; i++)
		{
			if (buffer[i] == 0)
				break;
			if (!(buffer[i] >= '0' && buffer[i] <= '9' || buffer[i] >= 'A' && buffer[i] <= 'F' || buffer[i] >= 'a' && buffer[i] <= 'f'))
				return false;
		}

		if (strcmp(lastBuffer, buffer) == 0)
			return false;
		strcpy(lastBuffer, buffer);

		#ifdef DEBUG_APP
			char string[256];
			sprintf(string, "Detected RFID tag %s at pin %d\n", buffer, pin);
			LOG(string);
		#endif

		// Send a POST to the goal server

		char content[160];
		sprintf(content, "tag=%s&token=%lu&table=%s", buffer, token, TABLE_ID);
		sprintf(string, "POST %s/events/rfid/%s HTTP/1.1\r\n"
			"Host: %s\r\n"
			"User-Agent: Arduino/DigitalerKicker\r\n"
			"Content-Type: application/x-www-form-urlencoded\r\n"
			"Content-Length: %d\r\n\r\n%s", CONTEXT,
			pin == RFID_A_PIN ? "home" : "visitors", SERVER_NAME,
			strlen(content), content);

		token++;

		LOG("Sending request...\n");
		LOG(string);
		LOG("\n");
		#if defined(INTERNET_ETHERNET) || defined(INTERNET_WIFLY)
			client.print(string);
		#endif
	}
#endif

void resetGoal(int goalPin)
{
	LOG("Resetting goal ");
	LOG(goalPin == GOAL_A_PIN ? "A.\n" : "B.\n");

	// Reset goal flip-flop and wait for input to be false (LOW) again
	int resetTries = 0;
	do
	{
		digitalWrite(goalPin == GOAL_A_PIN ? RESET_A_PIN : RESET_B_PIN, HIGH);
		delay(10);
		digitalWrite(goalPin == GOAL_A_PIN ? RESET_A_PIN : RESET_B_PIN, LOW);
		delay(10);

		resetTries++;
		if (resetTries >= 200)
		{
			flashError(3);
			digitalWrite(LED_PIN, HIGH);
			LOG("Goal is stuck.\n");
			resetTries = 0;
   		}
	}
	while (digitalRead(goalPin) != LOW);
}

void resetNetwork()
{
	associated = false;
	connected = false;

	#if defined(INTERNET_ETHERNET)
		client.stop();
		client = Client(SERVER_IP, SERVER_PORT);
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
	#ifdef DEBUG_APP
		Serial.begin(9600);
	#endif

	LOG("Initializing...\n");

	pinMode(GOAL_A_PIN, INPUT);
	pinMode(GOAL_B_PIN, INPUT);
	pinMode(RESET_A_PIN, OUTPUT);
	pinMode(RESET_B_PIN, OUTPUT);
	#if defined(RFID_A_PIN) && defined(RFID_B_PIN)
		pinMode(RFID_A_PIN, INPUT);
		pinMode(RFID_B_PIN, INPUT);
	#endif
	pinMode(LED_PIN, OUTPUT);

	digitalWrite(GOAL_A_PIN, LOW);
	digitalWrite(GOAL_B_PIN, LOW);
	digitalWrite(RESET_A_PIN, LOW);
	digitalWrite(RESET_B_PIN, LOW);
	#if defined(RFID_A_PIN) && defined(RFID_B_PIN)
		digitalWrite(RFID_A_PIN, HIGH);
		digitalWrite(RFID_B_PIN, HIGH);
	#endif

	for (int i=0; i<10; i++)
	{
		digitalWrite(LED_PIN, LOW);
		delay(50);
		digitalWrite(LED_PIN, HIGH);
		delay(50);
	}

	randomSeed(analogRead(0));
	token = random(65535);

	#if defined(RFID_A_PIN) && defined(RFID_B_PIN)
		rfidBitDelay = 1000000L / 2400L - clockCyclesToMicroseconds(50);
		rfidABuffer[0] = 0;
		rfidAPos = 0;
		rfidALastBuffer[0] = 0;
		rfidBBuffer[0] = 0;
		rfidBPos = 0;
		rfidBLastBuffer[0] = 0;
	#endif

	#ifdef INTERNET_WIFLY
		wiFly.begin();

		while (!ensureConnection(true))
			delay(1000);
	#endif

	resetGoal(GOAL_A_PIN);
	resetGoal(GOAL_B_PIN);

	digitalWrite(LED_PIN, LOW);
	LOG("Initialization done.\n");
}

void loop()
{
	// Analyze inputs whether there is a goal


	if (digitalRead(GOAL_A_PIN) == HIGH)
	{
		handleGoal(GOAL_A_PIN);
		return;
	}

	if (digitalRead(GOAL_B_PIN) == HIGH)
	{
		handleGoal(GOAL_B_PIN);
		return;
	}

	// Then check for any RFID input

	#if defined(RFID_A_PIN) && defined(RFID_B_PIN)
		if (handleRfid(RFID_A_PIN, rfidABuffer, rfidAPos, rfidALastBuffer))
			return;

		if (handleRfid(RFID_B_PIN, rfidBBuffer, rfidBPos, rfidBLastBuffer))
			return;
	#endif
	
	// Also check that we are still connected to the server and access point

	#ifdef INTERNET_WIFLY
		if ((checkCount % 200000L) == 0)
			while (!ensureConnection(checkCount == 0))
				delay(5000);
	#endif

	delayMicroseconds(10);
	checkCount = (checkCount + 1) % 2000000L;
}


