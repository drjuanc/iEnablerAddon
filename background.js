//Default configuration. The popup and content scripts read it by index, so keep the order.
const DEFAULT_CONFIG = [
    ['customTheme', true],       //[0]
    ['customColors', true],      //[1]
    ['wgca', true],              //[2]
    ['customLogin', true],       //[3]
    ['customLoginColors', true], //[4]
    ['fixWSULogo', true],       //[5]
    ['personnelDef', true],       //[6]
    ['cleanLogin', true],       //[7]
    ['otherConfg', false]

];

chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install') {
        //On install save the default config in storage
        storeConfig(DEFAULT_CONFIG);

    } else if (details.reason === 'update') {
        //On update keep the user's settings and only add the options that are missing
        chrome.storage.sync.get('config', function (result) {
            storeConfig(mergeConfig(result.config));
        });
    }
});

//Build the config in the default order, keeping every value the user already has
function mergeConfig(storedConfig) {
    if (!Array.isArray(storedConfig)) return DEFAULT_CONFIG;

    let merged = DEFAULT_CONFIG.map(function ([key, value]) {
        let existing = storedConfig.find(item => Array.isArray(item) && item[0] === key);
        return existing ? [key, existing[1]] : [key, value];
    });

    //Keep any stored options that are no longer in the defaults, so nothing is lost
    storedConfig.forEach(function (item) {
        if (Array.isArray(item) && !DEFAULT_CONFIG.some(([key]) => key === item[0])) merged.push(item);
    });

    return merged;
}

/*Stores the config in the user chrome profile, this applies to all browser where the extension is active*/
function storeConfig(objConfig) {
    chrome.storage.sync.set({ config: objConfig });
}



//Get current Tab in order to insert the resources
function insertScript(code) {
    //lastFocusedWindow rather than windows.getCurrent, which has no meaning in a service worker
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (activeTabs) {
        activeTabs.forEach(function (tab) {

            chrome.scripting.executeScript(
                {
                    target: { tabId: tab.id, allFrames: true },
                    func: code
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

                if (request.param) {                                    
                    insertScript(addCustomLogin); //Activate the custom login adding a class to the body    
                    insertScript(addCustomLoginColors); //New colors
                    insertScript(fixWSULogo); //Fix the logo 
                    
                } else {
                    insertScript(removeCustomLogin); //deactivate the custom login adding a class to the body
                    insertScript(removeCustomLoginColors); //deactivate the new colors
                    insertScript(unFixWSULogo); //unfix the logo  
                }
                break;

            case 'customLoginColors':

                if (request.param) {  
                    insertScript(addCustomLoginColors); //New colors
                } else {
                    insertScript(removeCustomLoginColors); //deactivate the new colors
                }
                break;

            case 'fixWSULogo':

                if (request.param) {
                    insertScript(fixWSULogo); //Fix the logo
                } else {
                    insertScript(unFixWSULogo); //unfix the logo
                }
                break;

            case 'personnelDef':

                if (request.param) {
                    insertScript(personnelDef); //select the personnel as default
                } else {
                    insertScript(noPersonnelDef); //student as default
                }
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
/*These run in the page, so they cannot use anything else in this file*/
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

    //Login page wording, same as fixLoginTexts in content/content.js. Keep both in step.
    document.querySelectorAll('header.w3-blue h5').forEach(function (header) {
        if (header.textContent.trim() == 'Registered Users: Login Credentials') {
            header.dataset.ienablerOriginal = header.textContent;
            header.textContent = 'Login Credentials';
        }
    });

    var pin = document.querySelector('form[name="frmLogin"] input[name="pin"]');
    var hint = pin ? pin.nextElementSibling : null;
    var hintText = hint && hint.tagName == 'P' ? hint.firstChild : null;
    if (hintText && hintText.nodeType == Node.TEXT_NODE && hintText.nodeValue.includes('digits.Do')) {
        hint.dataset.ienablerOriginal = hintText.nodeValue;
        hintText.nodeValue = hintText.nodeValue.replace('digits.Do', 'digits. Do');
    }
}

//remove the class 'customLogin' bringing back the old theme
function removeCustomLogin() {
    document.body.classList.remove('customLogin');

    //Bring back the original login wording
    document.querySelectorAll('header.w3-blue h5[data-ienabler-original]').forEach(function (header) {
        header.textContent = header.dataset.ienablerOriginal;
        delete header.dataset.ienablerOriginal;
    });

    var hint = document.querySelector('form[name="frmLogin"] p[data-ienabler-original]');
    if (hint && hint.firstChild && hint.firstChild.nodeType == Node.TEXT_NODE) {
        hint.firstChild.nodeValue = hint.dataset.ienablerOriginal;
        delete hint.dataset.ienablerOriginal;
    }
}

//add the class 'customLoginColors' to the body to enable the new theme
function addCustomLoginColors() {
    document.body.classList.add("customLoginColors");
}

//remove the class 'customLoginColors' bringing back the old colors
function removeCustomLoginColors() {
    document.body.classList.remove('customLoginColors');
}

//Personnel as default
function personnelDef() {
    document.getElementsByName('numtype')[1].checked = true;
}

function noPersonnelDef() {
    document.getElementsByName('numtype')[0].checked = true;
}

//add the class 'cleanLogin' to the body
function cleanLogin() {
    document.body.classList.add("cleanLogin");
}

//remove the class 'cleanLogin' bringing back the default login
function noCleanLogin() {
    document.body.classList.remove('cleanLogin');
}

