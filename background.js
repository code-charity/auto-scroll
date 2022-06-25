/*--------------------------------------------------------------
>>> BACKGROUND
--------------------------------------------------------------*/

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	if (message === 'tab-connected') {
		var response = new URL(sender.tab.url).hostname;

		sendResponse(response);

		return response;
	}else if (message === 'options-page-connected') {
		sendResponse({
			isPopup: sender.hasOwnProperty('tab') === false
		});
	}
});