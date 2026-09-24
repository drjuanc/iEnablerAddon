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
            arrConfig = result.config;

            //Depending on the config update the controls
            // "Custom Theme" switch
            if (arrConfig[0][0] = 'customTheme') {
                var arrItems = [$('#customTheme')];
                var arrSubItems = [$('#customColors'), $('#wcga'), $('#customColorsH6'), $('#wcgaH6')]
                changeItemStatus(arrSubItems, arrConfig[0][1]);
                changeSwitchState(arrItems, arrConfig[0][1]);
            }


            // "Custom Login" switch
            if (arrConfig[3][0] = 'customLogin') {
                var arrItems = [ //To uncheck
                    $('#customLogin'), $('#fixLogo'),
                    $('#customLoginColors'), $('#personnelDef'),
                    $('#cleanLogin')
                ]; 
                var arrSubItems = [ //to deactivate
                    $('#customLoginColors'), $('#customLoginColorsH6'),
                    $('#fixLogo'), $('#fixLogoH6'),
                    $('#personnelDef'), $('#personnelDefH6'),
                    $('#cleanLogin'), $('#cleanLoginH6')
                ]

                changeItemStatus(arrSubItems, arrConfig[3][1]);
                changeSwitchState(arrItems, arrConfig[3][1]);
            }

            // "Custom Login colors" switch
            if (arrConfig[4][0] = 'customLoginColors') {
                var arrItems = [$('#customLoginColors')]; //To uncheck

                //If the custom login is on 
                if (arrConfig[3][1] && arrConfig[4][1]) {
                    changeSwitchState(arrItems, true);
                } else {
                    changeSwitchState(arrItems, false);
                }
                    
            }

            // "Fix WSU logo" switch
            if (arrConfig[5][0] = 'fixWSULogo') {
                var arrItems = [$('#fixLogo')]; //To uncheck

                //If the custom login is on 
                if (arrConfig[3][1] && arrConfig[5][1]) {
                    changeSwitchState(arrItems, true);
                } else {
                    changeSwitchState(arrItems, false);
                }
            }

            // "Personnel as default" switch
            if (arrConfig[6][0] = 'personnelDef') {
                var arrItems = [$('#personnelDef')]; //To uncheck

                //If the custom login is on 
                if (arrConfig[3][1] && arrConfig[6][1]) {
                    changeSwitchState(arrItems, true);
                } else {
                    changeSwitchState(arrItems, false);
                }
            }

            // "Clean Login" switch
            if (arrConfig[7][0] = 'cleanLogin') {
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

                //Activate the theme sub-options.
                var items = [$("#customColors"), $("#wcga"), $("#customColorsH6"), $("#wcgaH6")];
                changeItemStatus(items, state);

            } else {
                //Otherwise trigger an error
                console.log("Error in the configuration option: " + arrConfig[0][0]);
                configCorruption();
            }

        event.preventDefault();


        });

        //Click on the custom colors switch
        $('#customColors').change(function (event) {

            var state = $(this).prop('checked');

            if (state) {
                // Activate the custom colors
            } else {
                // deactivate the custom colors
            }
            event.preventDefault();
        });

        //Click on the accesibility switch
        $('#wcga').change(function (event) {

            var state = $(this).prop('checked');

            if (state) {
                // Activate the accesibility options
            } else {
                // deactivate the accesibility options
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
                    $('#personnelDef'), $('#personnelDefH6'),
                    $('#cleanLogin'), $('#cleanLoginH6')
                ]
                var checkItems = [ //to check
                    $('#customLoginColors'),
                    $('#fixLogo'),
                    $('#personnelDef')                   
                ]
                //var chechItems = [$("#customColors"), $("#wcga")];
                changeItemStatus(items, state);
                changeSwitchState(checkItems, state);

                //Update the login page
                if (currentURL.includes('mi_login')) {

                    chrome.runtime.sendMessage({ action: "customLogin", param: state  }, function (response) {

                         if (response.noError) { //if all came back OK, activate or deactivate the theme sub-options

                         }
                    });                
                  
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

                    chrome.runtime.sendMessage({ action: "customLoginColors", param: state }, function (response) {

                        if (response.noError) { //if all came back OK, activate or deactivate the theme sub-options

                        }
                    });

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

                    chrome.runtime.sendMessage({ action: "fixWSULogo", param: state }, function (response) {

                        if (response.noError) { 
 
                        }
                    });

                }

            } else {
                //Otherwise trigger an error
                console.log("Error in the configuration option: " + arrConfig[5][0]);
                configCorruption();
            }
        });

        //Click on Perssonel as default
        $('#personnelDef').change(function (event) {

            var state = $(this).prop('checked'); //Selected or not
                
            if (arrConfig[6][0] == 'personnelDef') {
                //Update the config option and save the configuration options in the user profile
                arrConfig[6][1] = state;
                storeConfig(arrConfig);

                //Update the login page
                if (currentURL.includes('mi_login')) {
                        
                    chrome.runtime.sendMessage({ action: "personnelDef", param: state }, function (response) {

                        if (response.noError) {

                        }
                    });

                }

            } else {
                //Otherwise trigger an error
                console.log("Error in the configuration option: " + arrConfig[6][0]);
                configCorruption();
            }

        });

        //Click on Perssonel as default
        $('#cleanLogin').change(function (event) {

            var state = $(this).prop('checked'); //Selected or not

            if (arrConfig[7][0] == 'cleanLogin') {
                //Update the config option and save the configuration options in the user profile
                arrConfig[7][1] = state;
                storeConfig(arrConfig);

                //Update the login page
                if (currentURL.includes('mi_login')) {

                    chrome.runtime.sendMessage({ action: "cleanLogin", param: state }, function (response) {

                        if (response.noError) {

                        }
                    });

                }

            } else {
                //Otherwise trigger an error
                console.log("Error in the configuration option: " + arrConfig[7][0]);
                configCorruption();
            }
        });

    })//End Document.ready

}); //End Tab.query

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
        if (nodeType = 'INPUT') {
            items[x].prop('checked', state);
        }
    }
}

/*Stores the config in the user chrome profile, this applies to all browser where the extension is active*/
function storeConfig(objConfig) {

    for (let config in objConfig) {

        chrome.storage.sync.set({ config: objConfig }, function () {

        });
    };

}

function configCorruption(){
    chrome.notifications.create('configError', {
        type: 'basic',
        iconUrl: '../assets/icons/icon.png',
        title: 'Oops Something went wrong',
        message: 'Seems like there is some some configuration data corruption. Please reinstall the extension.',
        priority: 2
    });

}