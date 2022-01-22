/*--------------------------------------------------------------
>>> CONTENT SCRIPT
----------------------------------------------------------------
# Global variable
# Message
	# Listener
	# Sent
# Storage
	# Get
	# Set
	# Import
	# On changed
# Find container
# Cursor
	# Set
	# Reset
# Features
	# Auto
	# Drag & Drop
# Initialization
--------------------------------------------------------------*/

/*--------------------------------------------------------------
# GLOBAL VARIABLE
--------------------------------------------------------------*/

var extension = {
	hostname: location.hostname,
	request: null,
	animationRequest: null
};








/*--------------------------------------------------------------
# MESSAGE
--------------------------------------------------------------*/

extension.message = {};


/*--------------------------------------------------------------
# LISTENER
--------------------------------------------------------------*/

extension.message.listener = function (callback) {
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if (message === 'init') {
            if (window === window.top) {
                sendResponse(extension.hostname);
            }
        }
    });
};


/*--------------------------------------------------------------
# SENT
--------------------------------------------------------------*/

extension.message.sent = function (message, callback) {
    chrome.runtime.sendMessage(message, callback);
};








/*--------------------------------------------------------------
# STORAGE
--------------------------------------------------------------*/

extension.storage = {
    items: {}
};


/*--------------------------------------------------------------
# GET
--------------------------------------------------------------*/

extension.storage.get = function (key) {
    return this.items[key];
};


/*--------------------------------------------------------------
# SET
--------------------------------------------------------------*/

extension.storage.set = function (key, value) {
    var object = {};

    object[key] = value;

    this.items[key] = value;

    chrome.storage.local.set(object);
};


/*--------------------------------------------------------------
# IMPORT
--------------------------------------------------------------*/

extension.storage.import = function (callback) {
    chrome.storage.local.get(function (items) {
        extension.storage.items = items;

        document.removeEventListener('storage-import', callback);
        document.addEventListener('storage-import', callback);

        document.dispatchEvent(new CustomEvent('storage-import'));
    });
};


/*--------------------------------------------------------------
# ON CHANGED
--------------------------------------------------------------*/

extension.storage.onchanged = function (callback) {
    chrome.storage.onChanged.addListener(function (changes) {
        for (var key in changes) {
            var value = changes[key].newValue;

            extension.storage.items[key] = value;

            document.removeEventListener('storage-change', callback);
            document.addEventListener('storage-change', callback);

            document.dispatchEvent(new CustomEvent('storage-import'), {
                detail: {
                    key,
                    value
                }
            });
        }
    });
};








/*--------------------------------------------------------------
# EVENTS
--------------------------------------------------------------*/

extension.events = {
    data: {
        alt: false,
        ctrl: false,
        shift: false,
        keys: {}
    },
    keyboard: {},
    mouse: {}
};


/*--------------------------------------------------------------
# CREATE
--------------------------------------------------------------*/

extension.events.create = function (target) {
    for (var type in this[target]) {
        document.addEventListener(type, this[target][type], true);
    }
};


/*--------------------------------------------------------------
# REMOVE
--------------------------------------------------------------*/

extension.events.remove = function (target) {
    for (var type in this[target]) {
        document.removeEventListener(type, this[target][type]);
    }
};


/*--------------------------------------------------------------
# CHECK ACTIVE ELEMENT
--------------------------------------------------------------*/

extension.events.checkActiveElement = function () {
    if (
        event.target.isContentEditable ||
        [
            'EMBED',
            'INPUT',
            'OBJECT',
            'TEXTAREA',
            'IFRAME'
        ].includes((document.activeElement || {}).tagName)
    ) {
        return true;
    }
};


/*--------------------------------------------------------------
# FEATURES
--------------------------------------------------------------*/

extension.events.features = {};


/*--------------------------------------------------------------
# HANDLER
--------------------------------------------------------------*/

extension.events.handler = function () {
    var prevent = false;

    for (var key in extension.events.features) {
        var shortcut = extension.storage.items[key];

        if (shortcut) {
            var same_keys = true;

            if (
                (extension.events.data.alt === shortcut.alt || shortcut.hasOwnProperty('alt') === false) &&
                (extension.events.data.ctrl === shortcut.ctrl || shortcut.hasOwnProperty('ctrl') === false) &&
                (extension.events.data.shift === shortcut.shift || shortcut.hasOwnProperty('shift') === false) &&
                (extension.events.data.click === shortcut.click || shortcut.hasOwnProperty('click') === false) &&
                (extension.events.data.middle === shortcut.middle || shortcut.hasOwnProperty('middle') === false) &&
                (extension.events.data.context === shortcut.context || shortcut.hasOwnProperty('context') === false)
            ) {
                if (shortcut.keys) {
	                for (var code in extension.events.data.keys) {
	                    if (!shortcut.keys[code]) {
	                        same_keys = false;
	                    }
	                }

	                for (var code in shortcut.keys) {
	                    if (!extension.events.data.keys[code]) {
	                        same_keys = false;
	                    }
	                }
	            }

                if (same_keys === true) {
                	cancelAnimationFrame(extension.animationRequest);

                    extension.events.features[key]();

                    prevent = true;
                }
            }
        }
    }

    return prevent;
};


/*--------------------------------------------------------------
# KEYBOARD
--------------------------------------------------------------*/

extension.events.keyboard.keydown = function (event) {
    if (extension.events.checkActiveElement()) {
        return false;
    }

    if (event.code === 'AltLeft' || event.code === 'AltRight') {
        extension.events.data.alt = true;
    } else if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
        extension.events.data.ctrl = true;
    } else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        extension.events.data.shift = true;
    } else {
        extension.events.data.keys[event.keyCode] = true;
    }

    extension.events.data.wheel = 0;
    extension.events.data.click = false;
    extension.events.data.middle = false;
    extension.events.data.context = false;

    if (extension.events.handler()) {
        event.preventDefault();
        event.stopPropagation();

        return false;
    }
};

extension.events.keyboard.keyup = function (event) {
    if (extension.events.checkActiveElement()) {
        return false;
    }

    if (event.code === 'AltLeft' || event.code === 'AltRight') {
        extension.events.data.alt = false;
    } else if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
        extension.events.data.ctrl = false;
    } else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        extension.events.data.shift = false;
    } else {
        delete extension.events.data.keys[event.keyCode];
    }

    extension.events.data.wheel = 0;
    extension.events.data.click = false;
    extension.events.data.middle = false;
    extension.events.data.context = false;
};


/*--------------------------------------------------------------
# MOUSE
--------------------------------------------------------------*/

extension.events.mouse.mousemove = function (event) {
	extension.cursor.x = event.clientX;
	extension.cursor.y = event.clientY;
	extension.cursor.target = event.target;
};

extension.events.mouse.mousedown = function (event) {
	if (
        extension.events.data.click && event.button === 0 ||
        extension.events.data.middle && event.button === 1
    ) {
        extension.events.data = {
            alt: false,
            ctrl: false,
            shift: false,
            keys: {}
        };
    }

    extension.events.data.click = false;
    extension.events.data.middle = false;
    extension.events.data.context = false;

    if (event.button === 0) {
        extension.events.data.click = true;
    } else if (event.button === 1) {
        extension.events.data.middle = true;
    }

    if (extension.events.handler()) {
        event.preventDefault();
        event.stopPropagation();

        extension.mousedown = true;

        return false;
    }
};

extension.events.mouse.mouseup = function (event) {
	if (extension.events.data.context) {
        extension.events.data = {
            alt: false,
            ctrl: false,
            shift: false,
            keys: {}
        };
    }

    extension.events.data.context = true;
    extension.events.data.middle = false;
    extension.events.data.click = false;

    if (extension.mousedown === true) {
        event.preventDefault();
        event.stopPropagation();

        extension.mousedown = false;

        return false;
    }
};







/*--------------------------------------------------------------
# FIND CONTAINER
--------------------------------------------------------------*/

extension.findContainer = function (target) {
	if (target.isContentEditable !== true) {
		var style = getComputedStyle(target);

		while (
			target.parentNode !== document &&
			((style.overflowX !== 'auto' && style.overflowX !== 'scroll') || target.scrollWidth <= target.clientWidth) &&
			((style.overflowY !== 'auto' && style.overflowY !== 'scroll') || target.scrollHeight <= target.clientHeight)
		) {
			target = target.parentNode;

			style = getComputedStyle(target);
		}

		if (
			document.scrollingElement &&
			(target === document.documentElement || target === document.body)
		) {
			target = document.scrollingElement;
		}

		extension.target = target;
	}
};








/*--------------------------------------------------------------
# CURSOR
--------------------------------------------------------------*/

extension.cursor = {
	x: 0,
	y: 0,
	target: document.documentElement
};


/*--------------------------------------------------------------
# SET
--------------------------------------------------------------*/

extension.cursor.set = function (type) {
	document.documentElement.dataset.autoScrollCursor = type;
};


/*--------------------------------------------------------------
# RESET
--------------------------------------------------------------*/

extension.cursor.reset = function () {
	delete document.documentElement.dataset.autoScrollCursor;
};








/*--------------------------------------------------------------
# FEATURES
--------------------------------------------------------------*/

/*--------------------------------------------------------------
# AUTO
--------------------------------------------------------------*/

extension.autoMode = {
	sensitivity: 10,
	mousedown: {
		x: 0,
		y: 0
	},
	offset: {
		x: 0,
		y: 0
	}
};


/*--------------------------------------------------------------
# START
--------------------------------------------------------------*/

extension.events.features.auto_scroll = function (event) {
	var data = extension.storage.items['auto_scroll'];

	if (data) {
		addEventListener('mousemove', extension.autoMode.check, true);

		if (
			data.click ||
			data.middle ||
			data.context
		) {
			addEventListener('mouseup', extension.autoMode.end, true);
		} else {
			addEventListener('keyup', extension.autoMode.end, true);
		}
	}
};


/*--------------------------------------------------------------
# CHECK
--------------------------------------------------------------*/

extension.autoMode.check = function (event) {
	var x = Math.abs(extension.autoMode.mousedown.x - event.clientX),
		y = Math.abs(extension.autoMode.mousedown.y - event.clientY);

	if (x > 5 || y > 5) {
		extension.cursor.set('all-scroll');

		extension.autoMode.mousedown.x = event.clientX;
		extension.autoMode.mousedown.y = event.clientY;

		extension.findContainer(event.target);
		extension.autoMode.move(event);
		extension.autoMode.scroll();

		addEventListener('mousemove', extension.autoMode.move, true);
		removeEventListener('mousemove', extension.autoMode.check, true);
	}
};


/*--------------------------------------------------------------
# MOVE
--------------------------------------------------------------*/

extension.autoMode.move = function (event) {
	var x = event.clientX - extension.autoMode.mousedown.x,
		y = event.clientY - extension.autoMode.mousedown.y;

	x = x / 100 * extension.autoMode.sensitivity;
	y = y / 100 * extension.autoMode.sensitivity;

	extension.autoMode.offset.x = x;
	extension.autoMode.offset.y = y;
};


/*--------------------------------------------------------------
# SCROLL
--------------------------------------------------------------*/

extension.autoMode.scroll = function () {
	var target = extension.target,
		x = target.scrollLeft + extension.autoMode.offset.x,
		y = target.scrollTop + extension.autoMode.offset.y;

	if (target.scroll) {
		target.scroll(x, y);
	} else {
		target.scrollLeft = x;
		target.scrollTop = y;
	}

	extension.request = requestAnimationFrame(extension.autoMode.scroll);
};


/*--------------------------------------------------------------
# END
--------------------------------------------------------------*/

extension.autoMode.end = function (event) {
	cancelAnimationFrame(extension.request);

	extension.cursor.reset();

	removeEventListener('mousemove', extension.autoMode.check, true);
	removeEventListener('mousemove', extension.autoMode.move, true);
	removeEventListener('mouseup', extension.autoMode.end, true);
};








/*--------------------------------------------------------------
# DRAG & DROP
--------------------------------------------------------------*/

extension.dragAndDrop = {
	mousedown: {
		x: 0,
		y: 0
	},
	offset: {
		x: 0,
		y: 0
	},
	scroll: {
		x: 0,
		y: 0
	}
};


/*--------------------------------------------------------------
# START
--------------------------------------------------------------*/

extension.events.features.drag_and_drop = function (event) {
	var data = extension.storage.items['drag_and_drop'];

	if (data) {
		extension.cursor.set('all-scroll');

		extension.dragAndDrop.mousedown.x = extension.cursor.x;
		extension.dragAndDrop.mousedown.y = extension.cursor.y;

		extension.findContainer(extension.cursor.target);

		extension.dragAndDrop.scroll.x = extension.target.scrollLeft;
		extension.dragAndDrop.scroll.y = extension.target.scrollTop;

		extension.dragAndDrop.move(event);
		extension.dragAndDrop.scroll();

		addEventListener('mousemove', extension.dragAndDrop.move, true);
		
		if (
			data.click ||
			data.middle ||
			data.context
		) {
			addEventListener('mouseup', extension.dragAndDrop.end, true);
		} else {
			addEventListener('keyup', extension.dragAndDrop.end, true);
		}
	}
};


/*--------------------------------------------------------------
# MOVE
--------------------------------------------------------------*/

extension.dragAndDrop.move = function (event) {
	extension.dragAndDrop.offset.x = extension.cursor.x - extension.dragAndDrop.mousedown.x;
	extension.dragAndDrop.offset.y = extension.cursor.y - extension.dragAndDrop.mousedown.y;
};


/*--------------------------------------------------------------
# SCROLL
--------------------------------------------------------------*/

extension.dragAndDrop.scroll = function () {
	var target = extension.target,
		x = extension.dragAndDrop.scroll.x - extension.dragAndDrop.offset.x,
		y = extension.dragAndDrop.scroll.y - extension.dragAndDrop.offset.y;

	if (target.scroll) {
		target.scroll(x, y);
	} else {
		target.scrollLeft = x;
		target.scrollTop = y;
	}

	extension.request = requestAnimationFrame(extension.dragAndDrop.scroll);
};


/*--------------------------------------------------------------
# END
--------------------------------------------------------------*/

extension.dragAndDrop.end = function (event) {
	cancelAnimationFrame(extension.request);

	extension.cursor.reset();

	removeEventListener('mousemove', extension.dragAndDrop.move, true);
	removeEventListener('mouseup', extension.dragAndDrop.end, true);
};








/*--------------------------------------------------------------
# TOUCHSCREEN
--------------------------------------------------------------*/

extension.touchscreen = {
	mousedown: {
		x: 0,
		y: 0
	},
	offset: {
		x: 0,
		y: 0
	},
	scroll: {
		x: 0,
		y: 0
	},
	momentum: {
		time: 0,
		x: 0,
		y: 0,
		speedX: 0,
		speedY: 0
	}
};


/*--------------------------------------------------------------
# START
--------------------------------------------------------------*/

extension.events.features.touchscreen = function (event) {
	var data = extension.storage.items['touchscreen'];

	if (data) {
		extension.cursor.set('all-scroll');

		extension.touchscreen.mousedown.x = extension.cursor.x;
		extension.touchscreen.mousedown.y = extension.cursor.y;

		extension.findContainer(extension.cursor.target);

		extension.touchscreen.scroll.x = extension.target.scrollLeft;
		extension.touchscreen.scroll.y = extension.target.scrollTop;

		extension.touchscreen.move(event);
		extension.touchscreen.scroll();

		addEventListener('mousemove', extension.touchscreen.move, true);
		
		if (
			data.click ||
			data.middle ||
			data.context
		) {
			addEventListener('mouseup', extension.touchscreen.end, true);
		} else {
			addEventListener('keyup', extension.touchscreen.end, true);
		}
	}
};


/*--------------------------------------------------------------
# MOVE
--------------------------------------------------------------*/

extension.touchscreen.move = function (event) {
	var now = performance.now();

	extension.touchscreen.offset.x = extension.cursor.x - extension.touchscreen.mousedown.x;
	extension.touchscreen.offset.y = extension.cursor.y - extension.touchscreen.mousedown.y;

	if (now - extension.touchscreen.momentum.time > 150) {
		extension.touchscreen.momentum.x = extension.cursor.x;
		extension.touchscreen.momentum.y = extension.cursor.y;
	
		extension.touchscreen.momentum.time = now;
	}
};


/*--------------------------------------------------------------
# SCROLL
--------------------------------------------------------------*/

extension.touchscreen.scroll = function () {
	var target = extension.target,
		x = extension.touchscreen.scroll.x - extension.touchscreen.offset.x,
		y = extension.touchscreen.scroll.y - extension.touchscreen.offset.y;

	target.scrollLeft = x;
	target.scrollTop = y;

	extension.request = requestAnimationFrame(extension.touchscreen.scroll);
};

extension.touchscreen.animation = function () {
	var momentum = extension.touchscreen.momentum;

	if (momentum.speedX !== 0 || momentum.speedY !== 0) {
		var target = extension.target;

		if (momentum.speedX > 0) {
			momentum.speedX--;
		} else if (momentum.speedX < 0) {
			momentum.speedX++;
		}

		if (momentum.speedY > 0) {
			momentum.speedY--;
		} else if (momentum.speedY < 0) {
			momentum.speedY++;
		}

		target.scrollLeft -= momentum.speedX;
		target.scrollTop -= momentum.speedY;

		extension.animationRequest = requestAnimationFrame(extension.touchscreen.animation);
	}
};


/*--------------------------------------------------------------
# END
--------------------------------------------------------------*/

extension.touchscreen.end = function (event) {
	extension.touchscreen.momentum.speedX = Math.min(Math.max(Math.floor((extension.cursor.x - extension.touchscreen.momentum.x) / 10), -40), 40);
	extension.touchscreen.momentum.speedY = Math.min(Math.max(Math.floor((extension.cursor.y - extension.touchscreen.momentum.y) / 10), -40), 40);
	
	console.log(extension.touchscreen.momentum.speedX, extension.touchscreen.momentum.speedY);
	
	cancelAnimationFrame(extension.request);

	extension.touchscreen.animation();

	extension.cursor.reset();

	removeEventListener('mousemove', extension.touchscreen.move, true);
	removeEventListener('mouseup', extension.touchscreen.end, true);
};








/*--------------------------------------------------------------
# ACTIVATION
--------------------------------------------------------------*/

/*--------------------------------------------------------------
# ENABLE
--------------------------------------------------------------*/

extension.enable = function () {
	extension.events.create('mouse');
    extension.events.create('keyboard');
};

/*--------------------------------------------------------------
# DISABLE
--------------------------------------------------------------*/

extension.disable = function () {
	extension.events.remove('mouse');
    extension.events.remove('keyboard');
};








/*--------------------------------------------------------------
# INITIALIZATION
--------------------------------------------------------------*/

extension.storage.onchanged(function (key, value) {
    if (key === 'domains') {
        if (value[extension.hostname] !== false) {
            extension.enable();
        } else {
            extension.disable();
        }
    }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message === 'init') {
        if (window === window.top) {
            sendResponse(extension.hostname);
        }
    }
});

chrome.runtime.sendMessage('get-tab-url', function (response) {
    extension.hostname = response.url;

    extension.storage.import(function () {
        if (!extension.storage.items.domains || extension.storage.items.domains[extension.hostname] !== false) {
            extension.enable();
        }
    });
});