/*Popup: the Settings and About tabs.
The settings are the config array from config.js, kept in chrome.storage.sync and read by index.
Saving is debounced (see storeConfig); the iEnabler pages and the login page update themselves when
the config changes (content/content.js)*/

var arrConfig; //The settings, read when the popup opens
//Options that only apply with the modern look, the master switch for the iEnabler pages and the
//login page: disabled while it is off. The colour scheme stays enabled: it also sets this window
var THEME_OPTIONS = ['customColors', 'wcga', 'hideFooter', 'fixLogo', 'userTypeGroup', 'userTypeDef', 'cleanLogin'];

function byId(id) {
    return document.getElementById(id);
}

/*========= Settings tab ==========*/
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

    // "Modern look" switch, and the options that depend on it
    if (arrConfig[0][0] == 'customTheme') setChecked('customTheme', arrConfig[0][1]);
    updateThemeOptions();

    // "I log in as" radios
    if (arrConfig[7] && arrConfig[7][0] == 'userType') {
        var userType = byId('userType' + arrConfig[7][1]);
        if (userType) userType.checked = true;
    }

    // "Colour scheme": the synced setting wins over the copy theme.js used. This window always follows
    //it; the iEnabler pages and the login page with the modern look (content.js)
    if (arrConfig[8] && arrConfig[8][0] == 'colourScheme') {
        var scheme = byId({ auto: 'colourSchemeAuto', light: 'colourSchemeLight', dark: 'colourSchemeDark' }[arrConfig[8][1]] || 'colourSchemeAuto');
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

//Enable the options while the modern look is on, showing each one's own setting; a disabled
//option shows off. The "I log in as" radios keep showing the choice
function updateThemeOptions() {
    var theme = arrConfig[0][1] === true;
    setDisabled(THEME_OPTIONS, !theme);
    [['customColors', 1, 'customColors'], ['wcga', 2, 'wgca'], ['fixLogo', 3, 'fixWSULogo'], ['userTypeDef', 4, 'userTypeDef'],
        ['cleanLogin', 5, 'cleanLogin'], ['hideFooter', 9, 'hideFooter']].forEach(function ([id, index, key]) {
        if (arrConfig[index] && arrConfig[index][0] == key) setChecked(id, theme && arrConfig[index][1]);
    });
}

//Save a switch's setting. The pages update themselves when it is saved (see content/content.js)
function saveSwitch(id, index, key) {
    onChange(id, function (state) {
        if (!configEntryIs(index, key)) return;
        arrConfig[index][1] = state;
        storeConfig(arrConfig);
    });
}

// "Use the modern look": the iEnabler pages and the login page. The other options keep their own settings
onChange('customTheme', function (state) {
    if (!configEntryIs(0, 'customTheme')) return;
    arrConfig[0][1] = state;
    storeConfig(arrConfig);
    updateThemeOptions();
});

saveSwitch('customColors', 1, 'customColors'); // "WSU colours"
saveSwitch('wcga', 2, 'wgca');                  // "Accessibility enhancements"
saveSwitch('hideFooter', 9, 'hideFooter');      // "Hide the page footer"
saveSwitch('fixLogo', 3, 'fixWSULogo');         // "New WSU logo"
saveSwitch('userTypeDef', 4, 'userTypeDef');    // "Pre-select my choice on the login page"
saveSwitch('cleanLogin', 5, 'cleanLogin');      // "Hide the Prospective Students box"

// "I log in as"
document.querySelectorAll('input[name="userType"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
        if (!arrConfig || !configEntryIs(7, 'userType')) return;
        arrConfig[7][1] = radio.value; //S, P, A or O
        storeConfig(arrConfig);
    });
});

// "Colour scheme": this window changes at once, the iEnabler pages and the login page when the setting is saved
document.querySelectorAll('input[name="colourScheme"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
        applyPopupTheme(radio.value);
        if (!arrConfig || !configEntryIs(8, 'colourScheme')) return;
        arrConfig[8][1] = radio.value;
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

function configCorruption(){
    chrome.notifications.create('configError', {
        type: 'basic',
        iconUrl: '../assets/icons/icon.png',
        title: 'Oops, something went wrong',
        message: 'The iEnablerAddon settings seem to be corrupted. Please reinstall the extension.',
        priority: 2
    });

}
