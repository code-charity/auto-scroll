/*--------------------------------------------------------------
>>> OPTIONS PAGE
----------------------------------------------------------------
# Global variable
# Initialization
--------------------------------------------------------------*/

/*--------------------------------------------------------------
# GLOBAL VARIABLE
--------------------------------------------------------------*/

var extension = {
	skeleton: {}
};


/*--------------------------------------------------------------
# INITIALIZATION
--------------------------------------------------------------*/

satus.storage.import(function (items) {
	var language = items.language;

	if (!language || language === 'default') {
		language = window.navigator.language;
	}

	satus.locale.import(language, function () {
		chrome.tabs.query({
			active: true,
			currentWindow: true
		}, function (tabs) {
			var tab = tabs[0];

			if (tab.url) {
				extension.hostname = new URL(tab.url).hostname;
			}

			if (
				tab.url &&
				(
					tab.url.startsWith('about:') ||
					tab.url.startsWith('chrome') ||
					tab.url.startsWith('edge') ||
					tab.url.startsWith('https://addons.mozilla.org') ||
					tab.url.startsWith('https://chrome.google.com/webstore') ||
					tab.url.startsWith('https://microsoftedge.microsoft.com/addons') ||
					tab.url.startsWith('moz') ||
					tab.url.startsWith('view-source:') ||
					tab.url.endsWith('.pdf')
				)
			) {
				extension.skeleton.main.layers.toolbar = {
					component: 'alert',
					variant: 'error',
					text: function () {
						return satus.locale.get('thePageHostnameIsProtectedByBrowser').replace('HOSTNAME', extension.hostname);
					}
				};
			} else {
				extension.skeleton.main.layers.toolbar = {
					component: 'alert',
					variant: 'success',

					switch: {
						component: 'switch',
						text: extension.hostname,
						storage: 'websites/' + extension.hostname + '/active',
						value: true
					}
				};
			}

			satus.render(extension.skeleton);

			extension.exportSettings();
			extension.importSettings();
		});
	}, '_locales/');
});

chrome.runtime.sendMessage('options-page-connected', function (response) {
	if (response && response.isPopup === false) {
		document.body.setAttribute('tab', '');
	}
});