chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {

    // since only one tab should be active and in the current window at once
    // the return variable should only have one entry
    let activeTab = tabs[0];
    let currentURL = activeTab.url; 
    let arrConfig;  

    /*The reason all is wrapped in because tabs.query is asyncronic request, to ensure trigger anything after getting the 
     data from the tab */

    $(document).ready(function () {   
            
        //Read the config and store it in the array
        chrome.storage.sync.get(function (result) {
            if (chrome.runtime.lastError) {
                console.warn('iEnablerAddon: could not read the settings: ' + chrome.runtime.lastError.message);
                result = {};
            }
            //Missing or incomplete settings show the defaults (see config.js). Nothing is saved
            //until the user changes something
            savedConfig = JSON.stringify(result.config);
            arrConfig = mergeConfig(result.config);

            //Depending on the config update the controls
            // "Custom Theme" switch
            if (arrConfig[0][0] == 'customTheme') {
                var arrItems = [$('#customTheme')];
                var arrSubItems = [$('#customColors'), $('#wcga'), $('#customColorsH6'), $('#wcgaH6')]
                changeItemStatus(arrSubItems, arrConfig[0][1]);
                changeSwitchState(arrItems, arrConfig[0][1]);
            }

            // "Custom colours" and "Improve accessibility" switches, on only while the custom theme is on
            if (arrConfig[1][0] == 'customColors') {
                changeSwitchState([$('#customColors')], arrConfig[0][1] && arrConfig[1][1]);
            }
            if (arrConfig[2][0] == 'wgca') {
                changeSwitchState([$('#wcga')], arrConfig[0][1] && arrConfig[2][1]);
            }


            // "Custom Login" switch
            if (arrConfig[3][0] == 'customLogin') {
                var arrItems = [ //To uncheck
                    $('#customLogin'), $('#fixLogo'),
                    $('#customLoginColors'), $('#userTypeDef'),
                    $('#cleanLogin')
                ]; 
                var arrSubItems = [ //to deactivate
                    $('#customLoginColors'), $('#customLoginColorsH6'),
                    $('#fixLogo'), $('#fixLogoH6'),
                    $('#userTypeGroup'), $('#userTypeDef'),
                    $('#cleanLogin'), $('#cleanLoginH6')
                ]

                changeItemStatus(arrSubItems, arrConfig[3][1]);
                changeSwitchState(arrItems, arrConfig[3][1]);
            }

            // "Custom Login colors" switch
            if (arrConfig[4][0] == 'customLoginColors') {
                var arrItems = [$('#customLoginColors')]; //To uncheck

                //If the custom login is on 
                if (arrConfig[3][1] && arrConfig[4][1]) {
                    changeSwitchState(arrItems, true);
                } else {
                    changeSwitchState(arrItems, false);
                }
                    
            }

            // "Fix WSU logo" switch
            if (arrConfig[5][0] == 'fixWSULogo') {
                var arrItems = [$('#fixLogo')]; //To uncheck

                //If the custom login is on 
                if (arrConfig[3][1] && arrConfig[5][1]) {
                    changeSwitchState(arrItems, true);
                } else {
                    changeSwitchState(arrItems, false);
                }
            }

            // "I log in as" radios
            if (arrConfig[9] && arrConfig[9][0] == 'userType') {
                $('#userType' + arrConfig[9][1]).prop('checked', true);
            }

            // "Select this option by default" switch
            if (arrConfig[6][0] == 'userTypeDef') {
                var arrItems = [$('#userTypeDef')]; //To uncheck

                //If the custom login is on 
                if (arrConfig[3][1] && arrConfig[6][1]) {
                    changeSwitchState(arrItems, true);
                } else {
                    changeSwitchState(arrItems, false);
                }
            }

            // "Clean Login" switch
            if (arrConfig[7][0] == 'cleanLogin') {
                var arrItems = [$('#cleanLogin')]; //To uncheck

                //If the custom login is on 
                if (arrConfig[3][1] && arrConfig[7][1]) {
                    changeSwitchState(arrItems, true);
                } else {
                    changeSwitchState(arrItems, false);
                }
            }
        });

    
        //Click on the active theme switch
        $('#customTheme').change(function (event) {

            var state = $(this).prop('checked');

            //If the first config is the 'customTheme'
            if (arrConfig[0][0] == 'customTheme') {
                //Update the config option and save the configuration options in the user profile
                arrConfig[0][1] = state;  
                storeConfig(arrConfig);

                //Activate the theme sub-options. They keep their own settings.
                //The iEnabler pages update themselves when the config changes (see content/content.js)
                var items = [$("#customColors"), $("#wcga"), $("#customColorsH6"), $("#wcgaH6")];
                changeItemStatus(items, state);
                changeSwitchState([$('#customColors')], state && arrConfig[1][1]);
                changeSwitchState([$('#wcga')], state && arrConfig[2][1]);

            } else {
                //Otherwise trigger an error
                console.log("Error in the configuration option: " + arrConfig[0][0]);
                configCorruption();
            }

        event.preventDefault();


        });

        //Click on the custom colours switch
        $('#customColors').change(function (event) {

            var state = $(this).prop('checked');

            if (arrConfig[1][0] == 'customColors') {
                //Save it, the iEnabler pages update themselves (see content/content.js)
                arrConfig[1][1] = state;
                storeConfig(arrConfig);
            } else {
                //Otherwise trigger an error
                console.log("Error in the configuration option: " + arrConfig[1][0]);
                configCorruption();
            }
            event.preventDefault();
        });

        //Click on the accessibility switch
        $('#wcga').change(function (event) {

            var state = $(this).prop('checked');

            if (arrConfig[2][0] == 'wgca') {
                //Save it, the iEnabler pages update themselves (see content/content.js)
                arrConfig[2][1] = state;
                storeConfig(arrConfig);
            } else {
                //Otherwise trigger an error
                console.log("Error in the configuration option: " + arrConfig[2][0]);
                configCorruption();
            }
            event.preventDefault();
        });

        /*======Click on the Custom login page====*/
        $('#customLogin').change(function (event) {

            var state = $(this).prop('checked');

            //If the first config is the 'custom Login Theme'
            if (arrConfig[3][0] == 'customLogin') {
                //Update the config option and save the configuration options in the user profile
                arrConfig[3][1] = arrConfig[4][1] = arrConfig[5][1] = state;
                storeConfig(arrConfig);

                //Activate the theme sub-options.
                //var items = [$('#customLoginColors'), $('#fixLogo'), $('#customLoginColorsH6'), $('#fixLogoH6')];
                var items = [ //to deactivate
                    $('#customLoginColors'), $('#customLoginColorsH6'),
                    $('#fixLogo'), $('#fixLogoH6'),
                    $('#userTypeGroup'), $('#userTypeDef'),
                    $('#cleanLogin'), $('#cleanLoginH6')
                ]
                var checkItems = [ //to check
                    $('#customLoginColors'),
                    $('#fixLogo')
                ]
                //var chechItems = [$("#customColors"), $("#wcga")];
                changeItemStatus(items, state);
                changeSwitchState(checkItems, state);
                //The user type default keeps its own setting
                changeSwitchState([$('#userTypeDef')], state && arrConfig[6][1]);

                //Update the login page
                if (currentURL.includes('mi_login')) {

                    chrome.runtime.sendMessage({ action: "customLogin", param: state  }, messageSent);                
                  
                }

            } else {
                //Otherwise trigger an error
                console.log("Error in the configuration option: " + arrConfig[3][0]);
                configCorruption();
                changeItemStatus(items, false);
                changeSwitchState(items, false);
            }

            event.preventDefault();
        });

        //Click on the Custom colors of the login page
        $('#customLoginColors').change(function (event) {

            var state = $(this).prop('checked');
            //If the first config is the 'custom Login colors'
            if (arrConfig[4][0] == 'customLoginColors') {
                //Update the config option and save the configuration options in the user profile
                arrConfig[4][1] = state;
                storeConfig(arrConfig);

                //Update the login page
                if (currentURL.includes('mi_login')) {

                    chrome.runtime.sendMessage({ action: "customLoginColors", param: state }, messageSent);

                }

            } else {
                //Otherwise trigger an error
                console.log("Error in the configuration option: " + arrConfig[4][0]);
                configCorruption();
            }
            event.preventDefault();
        });

        //Click on Fix WSU LOGO
        $('#fixLogo').change(function (event) {

            var state = $(this).prop('checked'); //Selected or not

            if (arrConfig[5][0] == 'fixWSULogo') {
                //Update the config option and save the configuration options in the user profile
                arrConfig[5][1] = state;
                storeConfig(arrConfig);

                //Update the login page
                if (currentURL.includes('mi_login')) {

                    chrome.runtime.sendMessage({ action: "fixWSULogo", param: state }, messageSent);

                }

            } else {
                //Otherwise trigger an error
                console.log("Error in the configuration option: " + arrConfig[5][0]);
                configCorruption();
            }
        });

        //Click on "Select this option by default on the login page"
        $('#userTypeDef').change(function (event) {

            var state = $(this).prop('checked'); //Selected or not

            if (arrConfig[6][0] == 'userTypeDef') {
                //Update the config option and save the configuration options in the user profile
                arrConfig[6][1] = state;
                storeConfig(arrConfig);

                //Update the login page
                if (currentURL.includes('mi_login')) {

                    chrome.runtime.sendMessage({ action: "userTypeDef", param: state, type: $('input[name="userType"]:checked').val() }, messageSent);

                }

            } else {
                //Otherwise trigger an error
                console.log("Error in the configuration option: " + arrConfig[6][0]);
                configCorruption();
            }

        });

        //Click on "I log in as"
        $('input[name="userType"]').change(function (event) {

            var type = $(this).val(); //S, P, A or O

            if (arrConfig[9] && arrConfig[9][0] == 'userType') {
                //Update the config option and save the configuration options in the user profile
                arrConfig[9][1] = type;
                storeConfig(arrConfig);

                //Update the login page, only if this type is selected by default
                if (arrConfig[6][1] && currentURL.includes('mi_login')) {

                    chrome.runtime.sendMessage({ action: "userType", param: type }, messageSent);

                }

            } else {
                //Otherwise trigger an error
                console.log("Error in the configuration option: userType");
                configCorruption();
            }

        });

        //Click on Clean login
        $('#cleanLogin').change(function (event) {

            var state = $(this).prop('checked'); //Selected or not

            if (arrConfig[7][0] == 'cleanLogin') {
                //Update the config option and save the configuration options in the user profile
                arrConfig[7][1] = state;
                storeConfig(arrConfig);

                //Update the login page
                if (currentURL.includes('mi_login')) {

                    chrome.runtime.sendMessage({ action: "cleanLogin", param: state }, messageSent);

                }

            } else {
                //Otherwise trigger an error
                console.log("Error in the configuration option: " + arrConfig[7][0]);
                configCorruption();
            }
        });

    })//End Document.ready

}); //End Tab.query

/*=========Home and Contact tabs==========*/
$(document).ready(function () {
    var version = chrome.runtime.getManifest().version;

    //Version number next to the name and in the footer
    $('.jsVersion').text('v' + version);

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
    $('#lnkReport').attr('href', 'mailto:jgarcia-alonso@wsu.ac.za'
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(body));

    //Links do not open reliably from inside the popup, so open them in a new tab
    $('.jsExternal').click(function (event) {
        event.preventDefault();
        chrome.tabs.create({ url: this.href });
    });
});

/*=========Services functions==========*/
/*===All the reusable functions needded for the config page "Popup"===*/

/*Enable or disable the switch and switch headings*/
//var "items"" is an array of DOM objects, var 'state'' is true or false
function changeItemStatus(items, state) {

    for (var x in items) {        
        var nodeType = (items[x].prop('nodeName'));
        switch (nodeType) {

            case 'INPUT':
                items[x].attr('disabled', !state);
                break;

            case 'FIELDSET': //disables every radio inside
                items[x].prop('disabled', !state);
                items[x].css('opacity', state ? 1 : 0.6);
                break;

            default:
                opacity = state ? 1 : 0.6;
                items[x].css('opacity', opacity);

        }
    }

}

/*Change the status (check or uncheck) of the switch and switch headings*/
//var "items"" is an array of DOM objects, var 'state'' is true or false
function changeSwitchState(items, state) {
    for (var x in items) {
        var nodeType = (items[x].prop('nodeName'));
        //Only for switchs;
        if (nodeType == 'INPUT') {
            items[x].prop('checked', state);
        }
    }
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