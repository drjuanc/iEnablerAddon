/*Default settings and how to bring stored settings up to date.
Shared by background.js (importScripts) and the popup (popup.html), so both use the same defaults*/

//Default configuration. The popup and content scripts read it by index, so keep the order.
const DEFAULT_CONFIG = [
    ['customTheme', true],       //[0]
    ['customColors', true],      //[1]
    ['wgca', true],              //[2]
    ['customLogin', true],       //[3]
    ['customLoginColors', true], //[4]
    ['fixWSULogo', true],       //[5]
    ['userTypeDef', false],       //[6] select the user type below by default on the login page
    ['cleanLogin', true],       //[7]
    ['otherConfg', false],       //[8]
    ['userType', 'S']            //[9] S student, P personnel, A alumni, O other (values of the login radios)

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
