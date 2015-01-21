#include "WiFly.h"
#include "Client.h"


Client::Client(uint8_t * ip, uint16_t port)
	: stream(ParsedStream(SpiSerial))
{
	this->ip = ip;
	this->port = port;
	domain = NULL;

	open = false;
}

Client::Client(const char * domain, uint16_t port)
	: stream(ParsedStream(SpiSerial))
{
	ip = NULL;
	this->port = port;
	this->domain = domain;

	open = false;
}

int Client::available()
{
	if (!open)
		return 0;

	return stream.available();
}

boolean Client::connect(boolean pauseRequired)
{
	if (ip == NULL && domain == NULL && port == 0)
		return false;

	stream.reset();

	if (ip != NULL || domain != NULL)
	{
		wiFly.enterCommandMode(pauseRequired);
		wiFly.sendCommandPart("open ");

		if (ip != NULL)
		{
			char ipString[16];
			sprintf(ipString, "%d.%d.%d.%d", ip[0], ip[1], ip[2], ip[3]);
			wiFly.sendCommandPart(ipString);
		}
		else
			wiFly.sendCommandPart(domain);
	
		wiFly.sendCommandPart(" ");
		wiFly.sendCommandPart(port);
		if (!wiFly.sendCommand("", "*OPEN*"))
			return false;
	}

	open = true;
	wiFly.inCommandMode = false;

	return true;
}

void Client::disconnect()
{
	wiFly.enterCommandMode();
	if (wiFly.sendCommand("close", ""))
		wiFly.waitForPrompt();

	stream.reset();
	open = false;
}

void Client::flush()
{
	if (!open)
		return;

	while (stream.available() > 0)
		stream.read();
}

boolean Client::isConnected()
{
	return open && !stream.closed();
}

int Client::read()
{
	if (!open)
		return -1;

	return stream.read();
}

void Client::write(byte value)
{
	wiFly.uart.write(value);
}

void Client::write(const char * str)
{
	wiFly.uart.write(str);
}

void Client::write(const uint8_t * buffer, size_t size)
{
	wiFly.uart.write(buffer, size);
}
