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



//Get current Tab in order to insert the resources. 'args' are passed to the function
function insertScript(code, args) {
    //lastFocusedWindow rather than windows.getCurrent, which has no meaning in a service worker
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (activeTabs) {
        activeTabs.forEach(function (tab) {

            chrome.scripting.executeScript(
                {
                    target: { tabId: tab.id, allFrames: true },
                    func: code,
                    args: args || []
                },
                () => {
                    if (chrome.runtime.lastError) console.log(chrome.runtime.lastError.message);
                });
        });
    });

};


/*Listening  messages from the scripts*/
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

    try {
        switch (request.action) {
            case 'customTheme':


                ////
                break;

            case 'customLogin':

                //The WSU colours, colour scheme and footer (Appearance settings) follow, see iEnablerLogin in content/content.js
                if (request.param) {
                    insertScript(addCustomLogin); //Activate the custom login adding a class to the body
                    insertScript(fixWSULogo); //Fix the logo

                } else {
                    insertScript(removeCustomLogin); //deactivate the custom login adding a class to the body
                    insertScript(unFixWSULogo); //unfix the logo
                }
                break;

            case 'fixWSULogo':

                if (request.param) {
                    insertScript(fixWSULogo); //Fix the logo
                } else {
                    insertScript(unFixWSULogo); //unfix the logo
                }
                break;

            case 'userTypeDef':

                if (request.param) {
                    insertScript(selectUserType, [request.type]); //select the user type as default
                } else {
                    insertScript(selectUserType, ['S']); //student, the portal's default
                }
                break;

            case 'userType':

                insertScript(selectUserType, [request.param]); //a different user type, already the default
                break;

            case 'cleanLogin':

                if (request.param) {
                    insertScript(cleanLogin); // Clean the login page
                } else {
                    insertScript(noCleanLogin); //default login page
                }
                break;

                
        }

        sendResponse({ noError: true });

    } catch (e) {
        //console.log(e);
        sendResponse({ noError: false });
    }
})

/*=====Functions to be inserted in the page=====*/
/*These run in the page, so they cannot use anything else in this file. They share the
content scripts' isolated world, so they can call window.iEnablerLogin from content/content.js*/
//Replace the low-res WSU logo with the new one. Keep the width in step with fixWSULogo in content/content.js
function fixWSULogo() {
    var wsuLogo = document.getElementsByTagName("img")[0];
    if (!wsuLogo) return;
    wsuLogo.removeAttribute('height');
    wsuLogo.width = 360;
    wsuLogo.style.height = 'auto';
    wsuLogo.style.maxWidth = '90%';
    wsuLogo.src = chrome.runtime.getURL('assets/pics/wsu-logo-new.png');
}

//Bring back the original low-res logo
function unFixWSULogo() {
    var wsuLogo = document.getElementsByTagName("img")[0];
    if (!wsuLogo) return;
    wsuLogo.removeAttribute('width');
    wsuLogo.style.height = '';
    wsuLogo.style.maxWidth = '';
    wsuLogo.height = 200;
    wsuLogo.src = 'https://ieweb.wsu.ac.za/itsimages/InsImg.gif'

}


//add the class 'customLogin' to the body to enable the new theme
function addCustomLogin() {
    document.body.classList.add("customLogin");

    //Login wording and labels, and the Appearance settings (WSU colours, colour scheme, footer), see iEnablerLogin in content/content.js
    if (window.iEnablerLogin) window.iEnablerLogin.apply();
}

//remove the class 'customLogin' bringing back the old theme
function removeCustomLogin() {
    document.body.classList.remove('customLogin');

    //Bring back the original login wording and labels, and take off the Appearance settings
    if (window.iEnablerLogin) window.iEnablerLogin.restore();
}

//Select the user type radio on the login page (see iEnablerLogin in content/content.js)
function selectUserType(type) {
    if (window.iEnablerLogin) window.iEnablerLogin.selectUserType(type);
}

//add the class 'cleanLogin' to the body
function cleanLogin() {
    document.body.classList.add("cleanLogin");
}

//remove the class 'cleanLogin' bringing back the default login
function noCleanLogin() {
    document.body.classList.remove('cleanLogin');
}

