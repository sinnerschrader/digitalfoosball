#ifndef __WIFLY_DEVICE_H__
#define __WIFLY_DEVICE_H__

#include "Configuration.h"

#define DEFAULT_SERVER_PORT 80


// Debug level (0 = no debugging, 1 = operations, 2 = full data trace)
// WARNING: Due to a race condition, turning off debugging leads to disconnect latency
#define DEBUG 1

#if defined(DEBUG) && DEBUG >= 1
	#define LOG(message) log(message);
#else
	#define LOG(message) (((0)));
#endif

#if defined(DEBUG) && DEBUG >= 2
	#define LOG_WRITE(message) logWrite(message);
	#define LOG_READ(character) logRead(character);
#else
	#define LOG_WRITE(message) (((0)))
	#define LOG_READ(character) (((0)))
#endif


class WiFlyDevice
{
	friend class Client;
	friend class Server;

	public:

		enum Status
		{
			StatusError, StatusNotAssociated, StatusNoIp, StatusDisconnected, StatusConnecting, StatusConnected
		};

	private:

		#ifdef DEBUG
			int logDirection;
		#endif

		boolean inCommandMode;
		uint16_t serverPort;
		SpiUartDevice & uart;

		void attemptSwitchToCommandMode();
		boolean enterCommandMode(boolean pauseRequired = true);
		void exitCommandMode();
		#if defined(DEBUG) && DEBUG > 0
			void log(const char * text);
			void logRead(char character);
			void logWrite(const char * text);
		#endif
		void reboot();
		boolean sendCommand(const char * command, const char * expectedResponse = "AOK", unsigned int timeOut = 5000);
		void sendCommandPart(const char * text);
		void sendCommandPart(uint16_t number);
		void skipRemainderOfResponse();
		void switchToCommandMode();
		boolean waitForPrompt();
		boolean waitForResponse(const char * toMatch, unsigned int timeOut);

	public:

		WiFlyDevice(SpiUartDevice & uart);

		void begin();
		boolean findInResponse(const char * toMatch, unsigned int timeOut);
		const char * getIp(boolean pauseRequired = true);
		Status getStatus(boolean pauseRequired = true);
		boolean join(const char * ssid);
		boolean join(const char * ssid, const char * passphrase, boolean isWPA = true);
		void leave();
	};

#endif
