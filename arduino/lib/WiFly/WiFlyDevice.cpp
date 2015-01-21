#include "WiFly.h"

#define RETRY_ATTEMPTS 5


SpiUartDevice SpiSerial;
WiFlyDevice wiFly(SpiSerial);


WiFlyDevice::WiFlyDevice(SpiUartDevice & uart)
	: uart(uart)
{
	inCommandMode = false;
	serverPort = DEFAULT_SERVER_PORT;

	#if defined(DEBUG) && DEBUG >= 1
		logDirection = 0;
	#endif
}

void WiFlyDevice::begin()
{
	uart.begin();

	reboot();
	
	enterCommandMode(false);

	sendCommand("get uart", "Flow=0x");
	while (!uart.available())
	{
		//delay(1);
	}

	char flowControlState = uart.read();
	LOG_READ(flowControlState);
	waitForPrompt();

	if (flowControlState != '1')
	{
		sendCommand("set uart flow 1");
		waitForPrompt();
		sendCommand("save", "Storing in config");
		waitForPrompt();
		sendCommand("get uart", "Flow=0x1");
		waitForPrompt();
	
		reboot();
		enterCommandMode(false);
	}
	
	sendCommand("set wlan join 0");
	waitForPrompt();

	sendCommandPart("set ip localport ");
	sendCommandPart(serverPort);
	sendCommand("");
	waitForPrompt();

	sendCommand("set comm remote 0");
	waitForPrompt();
}

boolean WiFlyDevice::enterCommandMode(boolean pauseRequired)
{
	if (inCommandMode)
		return true;
	
	for (int retryCount = 0; retryCount < RETRY_ATTEMPTS; retryCount++)
	{
		if (pauseRequired)
			delay(250);
		
		sendCommandPart("$$$");
		delay(250);

		sendCommand("", "");
		sendCommand("", "");
		if (waitForPrompt())
		{
			inCommandMode = true;
			return true;
		}
	}

	return false;
}

void WiFlyDevice::exitCommandMode()
{
	if (!inCommandMode)
		return;
	
	inCommandMode = false;
	
	if (!sendCommand("exit", "EXIT"))
		return;

	skipRemainderOfResponse();
}

boolean WiFlyDevice::findInResponse(const char * toMatch, unsigned int timeOut)
{
	int byteRead;
	unsigned long timeOutTarget;
	for (unsigned int offset = 0; offset < strlen(toMatch); offset++)
	{
		timeOutTarget = millis() + timeOut;

		while (!uart.available())
		{
			if (millis() > timeOutTarget)
				return false;

			//delay(1);
		}

		byteRead = uart.read();
		LOG_READ(byteRead);
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

const char * WiFlyDevice::getIp(boolean pauseRequired)
{
	static char ip[16] = "";
	byte offset = 0;

	if (enterCommandMode(pauseRequired) && sendCommand("get ip", "IP="))
	{
		while (offset < 15)
		{
			char character = uart.read();
			LOG_READ(character);
			if (character == ':')
			{
				ip[offset] = '\x00';
				break;
			}
			else if (character != -1)
			{
				ip[offset] = character;
				offset++;
			}
		}
	}

	ip[offset] = '\x00';

	waitForPrompt();
	exitCommandMode();

	return ip;
}

WiFlyDevice::Status WiFlyDevice::getStatus(boolean pauseRequired)
{
	if (!enterCommandMode(pauseRequired) || !sendCommand("show c", "8"))
	{
		waitForPrompt();
		exitCommandMode();

		return StatusError;
	}

	char result[3] = {0, 0, 0};
	for (int i=0; i<3;)
	{
		result[i] = uart.read();
		LOG_READ(result[i]);
		if (result[i] <= 0 || result[i] > 128) continue;
		i++;
	}

	Status status;
	if (strchr("02468ACEace", result[1]))
		status = StatusNotAssociated;
	else if (result[2] == '3')
		status = StatusNoIp;
	else if (result[2] == '4')
		status = StatusConnecting;
	else if (result[2] == '1')
		status = StatusConnected;
	else
		status = StatusDisconnected;

	waitForPrompt();
	exitCommandMode();

	return status;
}

boolean WiFlyDevice::join(const char * ssid)
{
	if (!enterCommandMode())
		return false;
	
	sendCommandPart("join ");
	if (sendCommand(ssid, "Associated!", 30000))
	{
		waitForPrompt();
		return true;
	}

	return false;
}

boolean WiFlyDevice::join(const char * ssid, const char * passphrase, boolean isWPA)
{
	if (!enterCommandMode())
		return false;
	
	sendCommandPart("set wlan ");

	if (isWPA)
		sendCommandPart("passphrase ");
	else
		sendCommandPart("key ");

	sendCommand(passphrase);
	waitForPrompt();

	sendCommandPart("join ");
	if (sendCommand(ssid, "Associated!", 30000))
	{
		waitForPrompt();
		return true;
	}

	return false;
}

void WiFlyDevice::leave()
{
	if (!enterCommandMode())
		return;
	
	if (!sendCommand("leave"))
		return;
	
	waitForPrompt();
}

#if defined(DEBUG) && DEBUG >= 1
	void WiFlyDevice::log(const char * text)
	{
		if (logDirection != 0)
			Serial.println();
		
		Serial.print(text);
		logDirection = 0;
	}

	void WiFlyDevice::logRead(char character)
	{return;
		if (character < 0 || character == '\r')
			return;
	
		if (logDirection == 1)
			Serial.println();
		if (logDirection != -1)
			Serial.print("<<<     ");
		
		char string[2];
		sprintf(string, "%c", character);
		Serial.print(string);
	
		logDirection = character == '\n' ? 0 : -1;
	}

	void WiFlyDevice::logWrite(const char * text)
	{return;
		if (logDirection == -1)
			Serial.println();
		if (logDirection != 1)
			Serial.print("    >>> ");
		
		Serial.print(text);

		logDirection = text[0] && (text[strlen(text) - 1] == '\n' || text[strlen(text) - 1] == '\r') ? 0 : 1;
	}
#endif

void WiFlyDevice::reboot()
{
	#if USE_HARDWARE_RESET
		uart.ioSetDirection(0b00000010);
		uart.ioSetState(0b00000000);
		delay(10);
		uart.ioSetState(0b00000010);

		findInResponse("*READY*", 10000);
	#else
		while (true)
		{
			if (!enterCommandMode())
				continue;

			sendCommand("reboot", "");
			if (findInResponse("*READY*", 5000))
				break;
		}
	#endif

	delay(1000);
}

boolean WiFlyDevice::sendCommand(const char * command, const char * expectedResponse, unsigned int timeOut)
{
	uart.print(command);
	uart.flush();
	uart.println();

	LOG_WRITE(command);
	LOG_WRITE("\n");
	
	return waitForResponse(expectedResponse, timeOut);
}

void WiFlyDevice::sendCommandPart(const char * text)
{
	LOG_WRITE(text);
	uart.print(text);
}

void WiFlyDevice::sendCommandPart(uint16_t number)
{
	#if defined(DEBUG) && DEBUG >= 2
		char text[32];
		sprintf(text, "%d", number);
		LOG_WRITE(text);
	#endif
	
	uart.print(number);
}

void WiFlyDevice::skipRemainderOfResponse()
{
	findInResponse("\n", 2000);
}

boolean WiFlyDevice::waitForPrompt()
{
	if (!waitForResponse("<", 5000))
		return false;
	
	return findInResponse(" ", 2000);
}

boolean WiFlyDevice::waitForResponse(const char * toMatch, unsigned int timeOut)
{
	if (!toMatch[0])
		return true;

	LOG("Waiting for response '");
	LOG(toMatch);
	LOG("'\n");
	
	unsigned long timeOutTarget = millis() + timeOut;
	while (true)
	{
		int byteRead;
		unsigned int offset;
		for (offset = 0; offset < strlen(toMatch); offset++)
		{
			while (!uart.available())
			{
				if (millis() > timeOutTarget)
				{
					LOG("Wait timed out.\n");
					return false;
				}
				
				//delay(1);
			}
	
			byteRead = uart.read();
			LOG_READ(byteRead);
			if (byteRead != toMatch[offset])
				break;
		}
		
		if (offset >= strlen(toMatch))
		{
			LOG("Match, skipping rest of line.\n");
			return true;
		}

		skipRemainderOfResponse();
	}
}
