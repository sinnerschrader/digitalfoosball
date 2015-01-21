
// Based on interface defined in Ethernet's Client.h

#ifndef __WIFLY_CLIENT_H__
#define __WIFLY_CLIENT_H__

#include "Print.h"

#include "ParsedStream.h"

#include "WiFlyDevice.h"

class Client : public Print
{
	friend class Server;

	private:
		
		const char * domain;
		uint8_t * ip;
		boolean open;
		uint16_t port;
		ParsedStream stream;

	public:
	
		Client(uint8_t * ip, uint16_t port);
		Client(const char * domain, uint16_t port);
		int available();
		boolean connect(boolean pauseRequired);
		void disconnect();
		void flush();
		boolean isConnected();
		int read();
		void write(byte value);
		void write(const char * str);
		void write(const uint8_t * buffer, size_t size);

};

#endif
