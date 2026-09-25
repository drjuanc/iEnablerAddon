/*Default settings and how to bring stored settings up to date.
Shared by background.js (importScripts) and the popup (popup.html), so both use the same defaults*/

//Default configuration. The popup reads it by index, so keep the order.
//The modern look [0] is the master switch for the iEnabler pages and the login page: every other
//option applies only while it is on (see content/content.js)
const DEFAULT_CONFIG = [
    ['customTheme', true],       //[0] the modern look
    ['customColors', true],      //[1]
    ['wgca', true],              //[2]
    ['fixWSULogo', true],       //[3]
    ['userTypeDef', false],       //[4] select the user type below by default on the login page
    ['cleanLogin', true],       //[5]
    ['otherConfg', false],       //[6]
    ['userType', 'S'],           //[7] S student, P personnel, A alumni, O other (values of the login radios)
    ['colourScheme', 'auto'],    //[8] auto (follows the device), light or dark: the popup always, the iEnabler pages and the login page with the modern look
    ['hideFooter', false]        //[9] hide the bar of portal links at the bottom of the main page and the login page (with the modern look)

];

//Build the config in the default order, keeping every value the user already has
function mergeConfig(storedConfig) {
    if (!Array.isArray(storedConfig)) return DEFAULT_CONFIG.map(item => item.slice()); //A copy, so the defaults never change

    //Before v2.0.0 there was a 'Personnel as default' switch: on becomes Personnel selected by default,
    //off becomes Student, not by default
    let personnelDef = storedConfig.find(item => Array.isArray(item) && item[0] === 'personnelDef');
    storedConfig = storedConfig.filter(item => !(Array.isArray(item) && item[0] === 'personnelDef'));
    if (personnelDef && !storedConfig.some(item => Array.isArray(item) && item[0] === 'userTypeDef')) {
        let wasOn = personnelDef[1] === true;
        storedConfig.push(['userTypeDef', wasOn], ['userType', wasOn ? 'P' : 'S']);
    }

    //During the popup rewrite the colour scheme was briefly called 'popupTheme'
    let popupTheme = storedConfig.find(item => Array.isArray(item) && item[0] === 'popupTheme');
    storedConfig = storedConfig.filter(item => !(Array.isArray(item) && item[0] === 'popupTheme'));
    if (popupTheme && !storedConfig.some(item => Array.isArray(item) && item[0] === 'colourScheme')) {
        storedConfig.push(['colourScheme', popupTheme[1]]);
    }

    //Before v2.0.0 the login page had its own 'WSU colours' switch. It now follows the Appearance one
    //(customColors), so the old setting is dropped rather than kept at the end below
    storedConfig = storedConfig.filter(item => !(Array.isArray(item) && item[0] === 'customLoginColors'));

    //Before v2.0.0 the login page had its own master switch, 'Use the improved login page'. The modern
    //look now covers both, and is on if either of the two was on
    let customLogin = storedConfig.find(item => Array.isArray(item) && item[0] === 'customLogin');
    storedConfig = storedConfig.filter(item => !(Array.isArray(item) && item[0] === 'customLogin'));
    if (customLogin && customLogin[1] === true) {
        storedConfig = storedConfig.filter(item => !(Array.isArray(item) && item[0] === 'customTheme'));
        storedConfig.push(['customTheme', true]);
    }

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
