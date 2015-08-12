keys_page = [
    '', '', '', '',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '\n', '^]', '^H',
    '^I', ' ', '-', '=', '[', ']', '\\', '>', ';', "'", '`', ',', '.',
    '/', 'CapsLock', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
    'PS', 'SL', 'Pause', 'Ins', 'Home', 'PU', '^D', 'End', 'PD', '->', '<-', '-v', '-^', 'NL',
    'KP/', 'KP*', 'KP-', 'KP+', 'KPE', 'KP1', 'KP2', 'KP3', 'KP4', 'KP5', 'KP6', 'KP7', 'KP8',
    'KP9', 'KP0', '\\', 'App', 'Pow', 'KP=', 'F13', 'F14'
]

shift_keys_page = [
    '', '', '', '',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '\n', '^]', '^H',
    '^I', ' ', '_', '+', '{', '}', '|', '<', ':', '"', '~', '<', '>',
    '?', 'CapsLock', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
    'PS', 'SL', 'Pause', 'Ins', 'Home', 'PU', '^D', 'End', 'PD', '->', '<-', '-v', '-^', 'NL',
    'KP/', 'KP*', 'KP-', 'KP+', 'KPE', 'KP1', 'KP2', 'KP3', 'KP4', 'KP5', 'KP6', 'KP7', 'KP8',
    'KP9', 'KP0', '|', 'App', 'Pow', 'KP=', 'F13', 'F14'
]


def map_character(c):
    return keys_page[c]


def chunk_data(data, chunks):
    for i in xrange(0, len(data), chunks):
        yield data[i:i + chunks]


def raw_to_key(key):
    if key[0] == 2:
        return shift_keys_page[key[1]]
    else:
        return keys_page[key[1]]
