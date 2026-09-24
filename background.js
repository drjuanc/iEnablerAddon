let config;


chrome.runtime.onInstalled.addListener(function (details) {
    //On install save the config in storage
    //Set the default configuration in an array
    config = [
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

    storeConfig(config);

});

/*Stores the config in the user chrome profile, this applies to all browser where the extension is active*/
function storeConfig(objConfig) {
    
    for (let config in objConfig) {

        //console.log(config, objConfig[config]);
        chrome.storage.sync.set({ config: objConfig }, function () {

        });        
    };  

}



//Get current Tab in order to insert the resources
function insertScript(code) {
    chrome.windows.getCurrent(function (currentWindow) {
        chrome.tabs.query({ active: true, windowId: currentWindow.id }, function (activeTabs) {
            activeTabs.map(function (tab) {

                chrome.scripting.executeScript(
                    {
                        target: { tabId: tab.id, allFrames: true },
                        //files: [script],
                        func: code
                    },
                    (injectionResults) => {
                        //console.log('passed');
                    });
            });
        });
    });

};


/*Listening  messages from the scripts*/
chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {

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

/*=====Funtions to be inserted in the file=====*/
//Replace WSU low-res logo for a high-res one, the argument is the size in pixels of the new logo
function fixWSULogo() {

    //document.getElementsByName('numtype')[1].checked = true;  
    var wsuLogo = document.getElementsByTagName("img")[0];
    wsuLogo.width = 500;
    wsuLogo.src = chrome.runtime.getURL('assets/pics/wsulogo.jpg');
  
}

//Bring back the original crapy low-res logo
function unFixWSULogo(logoHeight) {
    var wsuLogo = document.getElementsByTagName("img")[0];
    wsuLogo.height = 200;
    wsuLogo.src = 'https://ieweb.wsu.ac.za/itsimages/InsImg.gif'

}


//add the class 'customLogin' to the body to ebale the new theme
function addCustomLogin() {
    document.body.classList.add("customLogin");
}

//remove the class 'customLogin' bringing back the old theme
function removeCustomLogin() {
    document.body.classList.remove('customLogin');
}

//add the class 'customLoginColors' to the body to ebale the new theme
function addCustomLoginColors() {
    document.body.classList.add("customLoginColors");
}

//remove the class 'customLoginColors' bringing back the old colors
function removeCustomLoginColors() {
    document.body.classList.remove('customLoginColors');
}

//Personel as default
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

