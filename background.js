/*---------------------------------------------------------------
>>> BACKGROUND
-----------------------------------------------------------------
# Listeners
    # On Install
    # Message
---------------------------------------------------------------*/

/*---------------------------------------------------------------
# LISTENERS
---------------------------------------------------------------*/

/*---------------------------------------------------------------
# ON INSTALL
---------------------------------------------------------------*/

chrome.runtime.onInstalled.addListener(function(event){
    if(event.reason === 'install') {
        chrome.storage.local.set({
            auto_scroll: {
                middle: true
            }
        });
    }
});


/*---------------------------------------------------------------
# MESSAGE
---------------------------------------------------------------*/

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message === 'get-tab-url') {
        var response = {
            url: new URL(sender.tab.url).hostname,
            id: sender.tab.id
        };

        sendResponse(response);

        return response;
    }
});