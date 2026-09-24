/*Popup: the Settings and About tabs.
The settings are the config array from config.js, kept in chrome.storage.sync and read by index.
Saving is debounced (see storeConfig); the iEnabler pages after login update themselves when the
config changes (content/content.js), the login page is updated live through background.js*/

var arrConfig; //The settings, read when the popup opens
//Appearance options that only apply with the modern look: disabled while it is off.
//The colour scheme stays enabled: it also sets this window and the login page
var APPEARANCE_OPTIONS = ['customColors', 'wcga', 'hideFooter'];
var currentURL = ''; //Address of the active tab, to update the login page live

function byId(id) {
    return document.getElementById(id);
}

/*========= Settings tab ==========*/
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    //Only the iEnabler pages give their address (host permission)
    currentURL = (tabs && tabs[0] && tabs[0].url) || '';
});

//Read the config and update the controls
chrome.storage.sync.get(function (result) {
    if (chrome.runtime.lastError) {
        console.warn('iEnablerAddon: could not read the settings: ' + chrome.runtime.lastError.message);
        result = {};
    }
    //Missing or incomplete settings show the defaults (see config.js). Nothing is saved
    //until the user changes something
    savedConfig = JSON.stringify(result.config);
    arrConfig = mergeConfig(result.config);

    // "Modern look" switch, and its sub-options: on only while it is on, keeping their own settings
    if (arrConfig[0][0] == 'customTheme') {
        setDisabled(APPEARANCE_OPTIONS, !arrConfig[0][1]);
        setChecked('customTheme', arrConfig[0][1]);
    }
    if (arrConfig[1][0] == 'customColors') setChecked('customColors', arrConfig[0][1] && arrConfig[1][1]);
    if (arrConfig[2][0] == 'wgca') setChecked('wcga', arrConfig[0][1] && arrConfig[2][1]);
    if (arrConfig[11] && arrConfig[11][0] == 'hideFooter') setChecked('hideFooter', arrConfig[0][1] && arrConfig[11][1]);

    // "Improved login page" switch
    if (arrConfig[3][0] == 'customLogin') {
        setDisabled(['customLoginColors', 'fixLogo', 'userTypeGroup', 'userTypeDef', 'cleanLogin'], !arrConfig[3][1]);
        setChecked('customLogin', arrConfig[3][1]);
    }

    //Login sub-options, on only while the improved login page is on
    if (arrConfig[4][0] == 'customLoginColors') setChecked('customLoginColors', arrConfig[3][1] && arrConfig[4][1]);
    if (arrConfig[5][0] == 'fixWSULogo') setChecked('fixLogo', arrConfig[3][1] && arrConfig[5][1]);

    // "I log in as" radios
    if (arrConfig[9] && arrConfig[9][0] == 'userType') {
        var userType = byId('userType' + arrConfig[9][1]);
        if (userType) userType.checked = true;
    }

    if (arrConfig[6][0] == 'userTypeDef') setChecked('userTypeDef', arrConfig[3][1] && arrConfig[6][1]);
    if (arrConfig[7][0] == 'cleanLogin') setChecked('cleanLogin', arrConfig[3][1] && arrConfig[7][1]);

    // "Colour scheme": the synced setting wins over the copy theme.js used. This window always follows
    //it; the iEnabler pages with the modern look, the login page with the improved login page (content.js)
    if (arrConfig[10] && arrConfig[10][0] == 'colourScheme') {
        var scheme = byId({ auto: 'colourSchemeAuto', light: 'colourSchemeLight', dark: 'colourSchemeDark' }[arrConfig[10][1]] || 'colourSchemeAuto');
        scheme.checked = true;
        applyPopupTheme(scheme.value);
    }
});

//Run the handler when the switch changes, once the settings have been read
function onChange(id, handler) {
    byId(id).addEventListener('change', function (event) {
        if (!arrConfig) return;
        handler(event.target.checked, event);
    });
}

//Check the config entry is where it should be before changing it
function configEntryIs(index, key) {
    if (arrConfig[index] && arrConfig[index][0] == key) return true;
    console.log('Error in the configuration option: ' + (arrConfig[index] ? arrConfig[index][0] : key));
    configCorruption();
    return false;
}

//Update the login page live, only when it is the active tab
function updateLoginPage(message) {
    if (currentURL.includes('mi_login')) chrome.runtime.sendMessage(message, messageSent);
}

// "Use the modern look"
onChange('customTheme', function (state) {
    if (!configEntryIs(0, 'customTheme')) return;
    arrConfig[0][1] = state;
    storeConfig(arrConfig);

    //Activate the sub-options. They keep their own settings.
    //The iEnabler pages update themselves when the config changes (see content/content.js)
    setDisabled(APPEARANCE_OPTIONS, !state);
    setChecked('customColors', state && arrConfig[1][1]);
    setChecked('wcga', state && arrConfig[2][1]);
    setChecked('hideFooter', state && arrConfig[11][1]);
});

// "WSU colours" (iEnabler pages)
onChange('customColors', function (state) {
    if (!configEntryIs(1, 'customColors')) return;
    arrConfig[1][1] = state;
    storeConfig(arrConfig);
});

// "Accessibility enhancements"
onChange('wcga', function (state) {
    if (!configEntryIs(2, 'wgca')) return;
    arrConfig[2][1] = state;
    storeConfig(arrConfig);
});

// "Hide the page footer"
onChange('hideFooter', function (state) {
    if (!configEntryIs(11, 'hideFooter')) return;
    arrConfig[11][1] = state;
    storeConfig(arrConfig);
});

// "Use the improved login page": also turns the WSU colours and the new logo on or off
onChange('customLogin', function (state) {
    if (!configEntryIs(3, 'customLogin')) return;
    arrConfig[3][1] = arrConfig[4][1] = arrConfig[5][1] = state;
    storeConfig(arrConfig);

    setDisabled(['customLoginColors', 'fixLogo', 'userTypeGroup', 'userTypeDef', 'cleanLogin'], !state);
    setChecked('customLoginColors', state);
    setChecked('fixLogo', state);
    //The user type default keeps its own setting
    setChecked('userTypeDef', state && arrConfig[6][1]);

    updateLoginPage({ action: 'customLogin', param: state });
});

// "WSU colours" (login page)
onChange('customLoginColors', function (state) {
    if (!configEntryIs(4, 'customLoginColors')) return;
    arrConfig[4][1] = state;
    storeConfig(arrConfig);
    updateLoginPage({ action: 'customLoginColors', param: state });
});

// "New WSU logo"
onChange('fixLogo', function (state) {
    if (!configEntryIs(5, 'fixWSULogo')) return;
    arrConfig[5][1] = state;
    storeConfig(arrConfig);
    updateLoginPage({ action: 'fixWSULogo', param: state });
});

// "Pre-select my choice on the login page"
onChange('userTypeDef', function (state) {
    if (!configEntryIs(6, 'userTypeDef')) return;
    arrConfig[6][1] = state;
    storeConfig(arrConfig);
    var checked = document.querySelector('input[name="userType"]:checked');
    updateLoginPage({ action: 'userTypeDef', param: state, type: checked ? checked.value : undefined });
});

// "I log in as"
document.querySelectorAll('input[name="userType"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
        if (!arrConfig) return;
        var type = radio.value; //S, P, A or O
        if (!(arrConfig[9] && arrConfig[9][0] == 'userType')) {
            console.log('Error in the configuration option: userType');
            configCorruption();
            return;
        }
        arrConfig[9][1] = type;
        storeConfig(arrConfig);
        //Update the login page, only if this type is selected by default
        if (arrConfig[6][1]) updateLoginPage({ action: 'userType', param: type });
    });
});

// "Hide the Prospective Students box"
onChange('cleanLogin', function (state) {
    if (!configEntryIs(7, 'cleanLogin')) return;
    arrConfig[7][1] = state;
    storeConfig(arrConfig);
    updateLoginPage({ action: 'cleanLogin', param: state });
});

// "Colour scheme": this window changes at once, the iEnabler pages when the setting is saved
document.querySelectorAll('input[name="colourScheme"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
        applyPopupTheme(radio.value);
        if (!arrConfig || !configEntryIs(10, 'colourScheme')) return;
        arrConfig[10][1] = radio.value;
        storeConfig(arrConfig);
    });
});

//Set the theme and keep a copy for theme.js, which sets it before the next popup is drawn
function applyPopupTheme(theme) {
    document.documentElement.dataset.popupTheme = theme;
    try {
        localStorage.setItem('colourScheme', theme);
    } catch (e) {
        //Storage blocked: the next popup starts on Automatic until the settings are read
    }
}

/*========= Tabs and sections ==========*/
//Tabs (WAI-ARIA tabs pattern): click, or arrow keys, Home and End, which also select the tab
var tabList = document.querySelector('[role="tablist"]');
var tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));

function selectTab(tab) {
    tabs.forEach(function (other) {
        var selected = other === tab;
        other.setAttribute('aria-selected', selected ? 'true' : 'false');
        other.tabIndex = selected ? 0 : -1;
        byId(other.getAttribute('aria-controls')).hidden = !selected;
    });
}

tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
        selectTab(tab);
    });
});

tabList.addEventListener('keydown', function (event) {
    var index = tabs.indexOf(document.activeElement);
    if (index < 0) return;
    var next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    var tab = tabs[(next + tabs.length) % tabs.length];
    selectTab(tab);
    tab.focus();
});

//Sections: each opens and closes on its own
document.querySelectorAll('.sectionToggle').forEach(function (button) {
    button.addEventListener('click', function () {
        var open = button.getAttribute('aria-expanded') != 'true';
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
        byId(button.getAttribute('aria-controls')).hidden = !open;
    });
});

/*========= About tab ==========*/
(function () {
    var version = chrome.runtime.getManifest().version;

    //Version number next to the name
    document.querySelectorAll('.jsVersion').forEach(function (element) {
        element.textContent = 'v' + version;
    });

    //"Report a problem" email, with the version and a short template filled in
    var subject = 'iEnablerAddon v' + version + ' \u2013 problem report';
    var body = [
        'What happened:',
        '',
        '',
        'What you expected to happen:',
        '',
        '',
        'Which iEnabler page (for example login, marks entry):',
        '',
        '',
        '---',
        'iEnablerAddon v' + version,
        'Browser: ' + navigator.userAgent
    ].join('\n');
    byId('lnkReport').href = 'mailto:jgarcia-alonso@wsu.ac.za'
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(body);

    //Links do not open reliably from inside the popup, so open them in a new tab
    document.querySelectorAll('.jsExternal').forEach(function (link) {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            chrome.tabs.create({ url: link.href });
        });
    });
})();

/*=========Services functions==========*/
/*Enable or disable switches and groups of radios. popup.css dims a disabled row or group*/
function setDisabled(ids, disabled) {
    ids.forEach(function (id) {
        byId(id).disabled = disabled;
    });
}

/*Turn a switch on or off, without saving anything*/
function setChecked(id, state) {
    byId(id).checked = !!state;
}

/*Stores the config in the user chrome profile, this applies to all browser where the extension is active*/
//Every save reaches the open iEnabler pages through chrome.storage.onChanged.
//chrome.storage.sync allows 120 writes a minute, so the saves are debounced: quick changes in a row
//become one write, and nothing is written when the settings are the same as the ones saved
const SAVE_DELAY = 400; //milliseconds
var savedConfig; //JSON of the settings in storage, set when the popup reads them
var pendingConfig = null;
var saveTimer = null;

function storeConfig(objConfig) {
    pendingConfig = objConfig;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(writeConfig, SAVE_DELAY);
}

function writeConfig() {
    clearTimeout(saveTimer);
    saveTimer = null;
    if (!pendingConfig) return;

    var json = JSON.stringify(pendingConfig);
    pendingConfig = null;
    if (json === savedConfig) return; //Back to what is already saved

    chrome.storage.sync.set({ config: JSON.parse(json) }, function () {
        if (chrome.runtime.lastError) {
            //Not marked as saved, so the next change tries again with all the settings
            console.warn('iEnablerAddon: could not save the settings: ' + chrome.runtime.lastError.message);
        } else {
            savedConfig = json;
        }
    });
}

//Closing the popup must not lose a change still waiting for the delay
window.addEventListener('pagehide', writeConfig);

//Callback for the messages to background.js that update the login page live
function messageSent(response) {
    if (chrome.runtime.lastError) console.warn('iEnablerAddon: could not update the page: ' + chrome.runtime.lastError.message);
}

function configCorruption(){
    chrome.notifications.create('configError', {
        type: 'basic',
        iconUrl: '../assets/icons/icon.png',
        title: 'Oops, something went wrong',
        message: 'The iEnablerAddon settings seem to be corrupted. Please reinstall the extension.',
        priority: 2
    });

}
