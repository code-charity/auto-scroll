/*--------------------------------------------------------------
>>> CONTENT SCRIPT
----------------------------------------------------------------
# Global variable
# Cursor
	# Set
	# Reset
# Storage
	# Get
	# Import
# Features
	# Auto scroll
	# Drag & Drop
# Initialization
--------------------------------------------------------------*/

/*--------------------------------------------------------------
# GLOBAL VARIABLE
--------------------------------------------------------------*/

var extension = {
	hostname: location.hostname,
	storage: {
		data: {}
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
# STORAGE
--------------------------------------------------------------*/

/*--------------------------------------------------------------
# GET
--------------------------------------------------------------*/

extension.storage.get = function (key) {
	var array = key.split('/'),
		target = extension.storage.data;

	for (var i = 0, l = array.length; i < l; i++) {
		var j = array[i];

		if (target[j] !== undefined) {
			target = target[j];

			if (i + 1 === l) {
				return target;
			}
		} else {
			return undefined;
		}
	}
};


/*--------------------------------------------------------------
# ON CHANGED
--------------------------------------------------------------*/

extension.storage.onchanged = function (callback) {
	chrome.storage.onChanged.addListener(function (changes) {
		for (var key in changes) {
			extension.storage.data[key] = changes[key].newValue;
		}
	});
};


/*--------------------------------------------------------------
# IMPORT
--------------------------------------------------------------*/

extension.storage.import = function (callback) {
	chrome.storage.local.get(function (items) {
		extension.storage.data = items;

		callback();
	});
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
# FEATURES
--------------------------------------------------------------*/

/*--------------------------------------------------------------
# AUTO SCROLL
--------------------------------------------------------------*/

extension.automatic = function (event) {
	if (event instanceof Event) {
		if (event.type === 'mousemove') {
			if (extension.automatic.active !== true) {
				var x = Math.abs(extension.automatic.mousedown.x - event.clientX),
					y = Math.abs(extension.automatic.mousedown.y - event.clientY);

				if (x > 5 || y > 5) {
					extension.cursor.set('all-scroll');

					extension.findContainer(event.target);

					extension.automatic.scroll();

					extension.automatic.active = true;

					event.preventDefault();
					event.stopPropagation();
				}
			} else {
				var x = event.clientX - extension.automatic.mousedown.x,
					y = event.clientY - extension.automatic.mousedown.y;

				x = x / 100 * extension.automatic.sensitivity;
				y = y / 100 * extension.automatic.sensitivity;

				extension.automatic.offset.x = x;
				extension.automatic.offset.y = y;
			}
		} else if (event.type === 'mousedown') {
			var option = extension.storage.get('autoScroll');

			if ((option === undefined || option === 'scroll_wheel') && event.button !== 1) {
				return;
			}

			extension.automatic.mousedown = {
				x: event.clientX,
				y: event.clientY
			};

			extension.automatic.offset = {
				x: 0,
				y: 0
			};

			window.addEventListener('mousemove', extension.automatic, true);
			window.addEventListener('mouseup', extension.automatic, true);
		} else if (event.type === 'mouseup') {
			window.removeEventListener('mousemove', extension.automatic, true);
			window.removeEventListener('mouseup', extension.automatic, true);

			if (extension.automatic.request) {
				cancelAnimationFrame(extension.automatic.request);
			}

			extension.automatic.active = false;

			extension.cursor.reset();

			event.preventDefault();
			event.stopPropagation();
		}
	} else {
		var option = extension.storage.get('autoScroll');

		if (option !== 'disabled') {
			extension.automatic.sensitivity = 10;

			extension.automatic.scroll = function scroll() {
				var target = extension.target,
					x = target.scrollLeft + extension.automatic.offset.x,
					y = target.scrollTop + extension.automatic.offset.y;

				if (target.scroll) {
					target.scroll(x, y);
				} else {
					target.scrollLeft = x;
					target.scrollTop = y;
				}

				extension.automatic.request = requestAnimationFrame(extension.automatic.scroll);
			};

			window.addEventListener('mousedown', extension.automatic, true);
		} else {
			window.removeEventListener('mousedown', extension.automatic, true);
		}
	}
};

/*--------------------------------------------------------------
# DRAG & DROP
--------------------------------------------------------------*/

extension.dragAndDrop = function (event) {
	if (event instanceof Event) {
		if (event.type === 'mousemove') {
			if (extension.dragAndDrop.active !== true) {
				var x = Math.abs(extension.dragAndDrop.mousedown.x - event.clientX),
					y = Math.abs(extension.dragAndDrop.mousedown.y - event.clientY);

				if (x > 2 || y > 2) {
					extension.cursor.set('grabbing');

					extension.findContainer(event.target);

					extension.dragAndDrop.scroll = {
						x: extension.target.scrollLeft,
						y: extension.target.scrollTop
					};

					extension.dragAndDrop.active = true;
				}
			} else {
				extension.dragAndDrop.offset.x = event.clientX - extension.dragAndDrop.mousedown.x;
				extension.dragAndDrop.offset.y = event.clientY - extension.dragAndDrop.mousedown.y;

				var target = extension.target,
					x = extension.dragAndDrop.scroll.x - extension.dragAndDrop.offset.x,
					y = extension.dragAndDrop.scroll.y - extension.dragAndDrop.offset.y;

				if (target.scroll) {
					target.scroll(x, y);
				} else {
					target.scrollLeft = x;
					target.scrollTop = y;
				}
			}

			event.preventDefault();
			event.stopPropagation();
		} else if (event.type === 'mousedown') {
			var option = extension.storage.get('dragAndDrop');

			if (
				option === 'left_mouse_button' && event.button !== 0 ||
				option === 'scroll_wheel' && event.button !== 1
			) {
				return;
			}

			extension.dragAndDrop.mousedown = {
				x: event.clientX,
				y: event.clientY
			};

			extension.dragAndDrop.offset = {
				x: 0,
				y: 0
			};

			window.addEventListener('mousemove', extension.dragAndDrop, true);
			window.addEventListener('mouseup', extension.dragAndDrop, true);
		} else if (event.type === 'mouseup') {
			window.removeEventListener('mousemove', extension.dragAndDrop, true);
			window.removeEventListener('mouseup', extension.dragAndDrop, true);

			extension.dragAndDrop.active = false;

			extension.cursor.reset();

			event.preventDefault();
			event.stopPropagation();
		}
	} else {
		var option = extension.storage.get('dragAndDrop');

		if (option !== 'disabled') {
			window.addEventListener('mousedown', extension.dragAndDrop, true);
		} else {
			window.removeEventListener('mousedown', extension.dragAndDrop, true);
		}
	}
};


/*--------------------------------------------------------------
# INITIALIZATION
--------------------------------------------------------------*/

chrome.runtime.sendMessage('tab-connected', function (response) {
	extension.hostname = response;

	extension.storage.import(function () {
		if (extension.storage.get('websites/' + extension.hostname + '/active') !== false) {
			extension.automatic();
			extension.dragAndDrop();
		}
	});

	extension.storage.onchanged(function () {
		if (extension.storage.get('websites/' + extension.hostname + '/active') !== false) {
			extension.automatic();
			extension.dragAndDrop();
		}
	});
});