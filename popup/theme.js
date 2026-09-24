/*Colour scheme of the popup, set before the popup is drawn so it never flashes light before turning dark.
The setting lives in the synced config (colourScheme, see config.js), which can only be read
asynchronously, so popup.js keeps a copy in localStorage for this file and corrects the theme
as soon as the synced settings are read. Styles: data-popup-theme in content/css/variables.css*/
(function () {
    var theme = 'auto';
    try {
        theme = localStorage.getItem('colourScheme') || 'auto';
    } catch (e) {
        //Storage blocked: Automatic
    }
    if (['auto', 'light', 'dark'].indexOf(theme) < 0) theme = 'auto';
    document.documentElement.dataset.popupTheme = theme;
})();
