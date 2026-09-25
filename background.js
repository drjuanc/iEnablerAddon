/*Background service worker: saves the default settings on install and brings them up to date on
update (see mergeConfig in config.js). The iEnabler pages and the login page apply the settings
themselves when they change (content/content.js)*/

//DEFAULT_CONFIG and mergeConfig
importScripts('config.js');

chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install') {
        //On install save the default config in storage
        storeConfig(DEFAULT_CONFIG);

    } else if (details.reason === 'update') {
        //On update keep the user's settings and only add the options that are missing.
        //Nothing is written when they are already complete, as after reloading the unpacked extension
        chrome.storage.sync.get('config', function (result) {
            if (chrome.runtime.lastError) {
                console.warn('iEnablerAddon: could not read the settings to update them: ' + chrome.runtime.lastError.message);
                return;
            }
            let merged = mergeConfig(result.config);
            if (JSON.stringify(merged) !== JSON.stringify(result.config)) storeConfig(merged);
        });
    }
});

/*Stores the config in the user chrome profile, this applies to all browser where the extension is active*/
function storeConfig(objConfig) {
    chrome.storage.sync.set({ config: objConfig }, function () {
        if (chrome.runtime.lastError) console.warn('iEnablerAddon: could not save the settings: ' + chrome.runtime.lastError.message);
    });
}
