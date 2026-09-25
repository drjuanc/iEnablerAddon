(() => {



    let currentURl = window.location.href; //Get the page URL
    let arrConfig; //Set the var config

    //New WSU logo, and the version shown on the dark sidebar of the main menu.
    //There is no official light logo yet, so the sidebar uses the same file turned white by
    //--logoOnDarkFilter in variables.css. When an official one arrives, point WSU_LOGO_ON_DARK
    //at it and set --logoOnDarkFilter to 'none'.
    const WSU_LOGO = 'assets/pics/wsu-logo-new.png';
    const WSU_LOGO_ON_DARK = 'assets/pics/wsu-logo-new.png';

    //Which part of the main menu page this script is running in, see frameRole below
    const FRAME = frameRole();
    //What is applied to this page, and how to undo it, see applySettings and revert below
    const applied = { theme: false, a11y: false };
    //The login page has its own groups (see applyLogin): 'logo' and 'loginA11y'
    const undo = { theme: [], a11y: [], logo: [], loginA11y: [] };
    //The device's light or dark setting, for the "Automatic" colour scheme
    const DARK_DEVICE = window.matchMedia('(prefers-color-scheme: dark)');
    let lastConfig = null; //Settings last applied, to apply again when the device setting changes
    const IS_LOGIN = currentURl.includes('mi_login');
    let login = null; //What is applied to the login page, see applyLogin

    //Tooltips for the mark type codes in the subjects table
    const MARK_TYPES = {
        NF: 'MTA - Nelson Mandela Drive',
        MD: 'MD - End of Module Test',
        MR: 'MR - POMR or Patient Presentation',
        TC: 'TC - WSU Tutor Score',
        ET: 'ET - End of Didactic Teaching Test',
        NW: 'NW - Learning Need Worksheet',
        OS: 'OS - OSCE Mark',
        LB: 'LB - Procedure Logbook',
        DP: 'DP - District Hospital Score',
        LC: 'LC - Elective mark',
        '0': 'Year mark',
        S1: 'S1 - Supplementary exam'
    };

    //Label of the number field for each login type (value of the 'numtype' radio)
    const NUMBER_LABELS = {
        S: 'Student number',
        P: 'Staff number',
        A: 'Student number', //Alumni log in with the student number they had
        O: 'User number'
    };
   

   //I read all settings and stored in a abject containing an array of propertyes
    chrome.storage.sync.get(function (result) {

        if (chrome.runtime.lastError) {
            console.warn('iEnablerAddon: could not read the settings: ' + chrome.runtime.lastError.message);
            return;
        }
        arrConfig = result.config;
        if (!Array.isArray(arrConfig)) return; //No settings stored yet
        /*==Now I read every individual configation and act accordingly==*/
        //Custom theme, custom colours and accessibility on the main menu page and its frames
        if (FRAME) applyConfig(arrConfig);

        //Login page: everything follows the settings, see applyLogin
        if (IS_LOGIN) {
            //Remove the margin of the main div. The login page may not have one: without this check
            //the error stopped everything below from running when the page loaded
            let main = document.querySelector('.w3-main');
            if (main) main.removeAttribute('style');

            applyLogin(arrConfig);
        }

    });


    //Replace the low-res WSU logo on the login page with the new one, keeping its aspect ratio.
    //revert('logo') brings back the original. The main menu logo is in themeTop
    function fixWSULogo(logoWidth) {

        var wsuLogo = document.getElementsByTagName("img")[0];
        if (!wsuLogo) return;
        ['height', 'width', 'style', 'src'].forEach(name => remember('logo', wsuLogo, name));
        wsuLogo.removeAttribute('height');
        wsuLogo.width = logoWidth;
        wsuLogo.style.height = 'auto';
        wsuLogo.style.maxWidth = '90%';

        wsuLogo.src = chrome.runtime.getURL(WSU_LOGO);

    }

    /*=== Login page wording and labels ===*/
    //Change the text of an element, keeping the original in data-ienabler-original
    function setText(element, text) {
        if (!element || element.textContent == text) return;
        element.dataset.ienablerOriginal = element.textContent;
        element.textContent = text;
    }

    function restoreText(element) {
        if (!element || element.dataset.ienablerOriginal === undefined) return;
        element.textContent = element.dataset.ienablerOriginal;
        delete element.dataset.ienablerOriginal;
    }

    //Link a label to its input for screen readers, remembering what was added so it can be removed
    function linkLabel(label, input, id) {
        if (!label || !input) return;
        if (!input.id) {
            input.id = id;
            input.dataset.ienablerId = '';
        }
        if (!label.htmlFor) {
            label.htmlFor = input.id;
            label.dataset.ienablerFor = '';
        }
    }

    function unlinkLabel(label, input) {
        if (label && label.dataset.ienablerFor !== undefined) {
            label.removeAttribute('for');
            delete label.dataset.ienablerFor;
        }
        if (input && input.dataset.ienablerId !== undefined) {
            input.removeAttribute('id');
            delete input.dataset.ienablerId;
        }
    }

    function loginElements() {
        var form = document.querySelector('form[name="frmLogin"]');
        if (!form) return null;
        var unum = form.querySelector('input[name="unum"]');
        var pin = form.querySelector('input[name="pin"]');
        var pinLabel = unum && unum.nextElementSibling && unum.nextElementSibling.tagName == 'LABEL' ? unum.nextElementSibling : null;
        var hint = pin && pin.nextElementSibling && pin.nextElementSibling.tagName == 'P' ? pin.nextElementSibling : null;
        return { form: form, unum: unum, pin: pin, numberLabel: document.getElementById('LogUsr'), pinLabel: pinLabel, hint: hint };
    }

    //Number label for the selected radio. The portal's own onclick (set_it) runs first and writes
    //its text, which is kept in data-ienabler-original so it can be restored
    function updateNumberLabel() {
        var login = loginElements();
        if (!login || !login.numberLabel) return;
        var radio = login.form.querySelector('input[name="numtype"]:checked');
        var text = NUMBER_LABELS[radio ? radio.value : 'S'];
        if (text) setText(login.numberLabel, text);
        linkLabel(login.numberLabel, login.unum, 'ienablerUnum');
    }

    function fixLoginTexts() {
        document.querySelectorAll('header.w3-blue h5').forEach(function (header) {
            if (header.textContent.trim() == 'Registered Users: Login Credentials') setText(header, 'Login Credentials');
        });

        var login = loginElements();
        if (!login) return;

        //Missing space in the pin hint. Only the text node changes: the <p> also holds a hidden input
        var hintText = login.hint ? login.hint.firstChild : null;
        if (hintText && hintText.nodeType == Node.TEXT_NODE && hintText.nodeValue.includes('digits.Do')) {
            login.hint.dataset.ienablerOriginal = hintText.nodeValue;
            hintText.nodeValue = hintText.nodeValue.replace('digits.Do', 'digits. Do');
        }

        setText(login.pinLabel, 'PIN');
        linkLabel(login.pinLabel, login.pin, 'ienablerPin');
        updateNumberLabel();
    }

    function restoreLoginTexts() {
        document.querySelectorAll('header.w3-blue h5').forEach(restoreText);

        var login = loginElements();
        if (!login) return;

        if (login.hint && login.hint.dataset.ienablerOriginal !== undefined && login.hint.firstChild) {
            login.hint.firstChild.nodeValue = login.hint.dataset.ienablerOriginal;
            delete login.hint.dataset.ienablerOriginal;
        }

        restoreText(login.pinLabel);
        restoreText(login.numberLabel);
        unlinkLabel(login.pinLabel, login.pin);
        unlinkLabel(login.numberLabel, login.unum);
    }

    //Click the radio for the user type, so the portal's own onclick runs as if the user had clicked it
    function selectUserType(type) {
        if (!NUMBER_LABELS.hasOwnProperty(type)) return;
        var radio = document.querySelector('form[name="frmLogin"] input[name="numtype"][value="' + type + '"]');
        if (radio) radio.click();
    }

    /*=== Login page: the settings ===*/
    //The modern look (customTheme) is the login page's master switch. With it on, the page takes the
    //WSU colours, the colour scheme, the footer and the accessibility enhancements from Appearance,
    //and the logo, the Prospective Students box and the user type from the Login page section.
    //applyLogin runs when the page loads and again whenever the settings change
    //(chrome.storage.onChanged below), applying and reverting only what changed.
    //Classes: 'customLogin', 'cleanLogin' and 'customLoginColors' on <body> (login.css, dark.css),
    //'ie-dark', 'ie-no-footer' and 'ie-a11y' on <html> (dark.css, login.css, accessibility.css)
    function loginSettings(config) {
        let on = setting(config, 'customTheme') === true;
        return {
            on: on,
            logo: on && setting(config, 'fixWSULogo') === true,
            clean: on && setting(config, 'cleanLogin') === true,
            colours: on && setting(config, 'customColors') === true,
            scheme: setting(config, 'colourScheme') || 'auto',
            noFooter: on && setting(config, 'hideFooter') === true,
            a11y: on && setting(config, 'wgca') === true,
            userTypeDef: setting(config, 'userTypeDef') === true,
            userType: setting(config, 'userType')
        };
    }

    function applyLogin(config) {
        let settings = loginSettings(config);
        let was = login || { on: false, logo: false, a11y: false, userTypeDef: false };
        let body = document.body;
        let root = document.documentElement;

        //The accessibility changes are made on elements the modern look also changes (the labels),
        //so they come off first and go back on last
        if (was.a11y && !settings.a11y) {
            revert('loginA11y');
            root.classList.remove('ie-a11y');
        }

        //Layout (login.css), and the header, labels and pin hint
        if (settings.on != was.on) {
            body.classList.toggle('customLogin', settings.on);
            if (settings.on) fixLoginTexts();
            else restoreLoginTexts();
        }

        if (settings.logo != was.logo) {
            if (settings.logo) fixWSULogo(360);
            else revert('logo');
        }

        body.classList.toggle('cleanLogin', settings.clean);
        body.classList.toggle('customLoginColors', settings.colours);
        root.classList.toggle('ie-no-footer', settings.noFooter);

        if (settings.a11y && !was.a11y) {
            root.classList.add('ie-a11y');
            loginAccessibility();
        }

        //Pre-select the user type when the page opens, and again when the choice changes. Turning it
        //off goes back to Student, the portal's default
        if (settings.on && settings.userTypeDef && (!was.on || !was.userTypeDef || settings.userType != was.userType)) {
            selectUserType(settings.userType);
        } else if (settings.on && was.on && was.userTypeDef && !settings.userTypeDef) {
            selectUserType('S');
        }

        login = settings;
        updateLoginDark();
    }

    //Dark with the modern look on and the colour scheme set to Dark, or Automatic on a device set to dark
    function updateLoginDark() {
        let dark = !!login && login.on && (login.scheme == 'dark' || (login.scheme == 'auto' && DARK_DEVICE.matches));
        document.documentElement.classList.toggle('ie-dark', dark);
    }

    if (IS_LOGIN) {
        chrome.storage.onChanged.addListener(function (changes, areaName) {
            if (areaName == 'sync' && changes.config && Array.isArray(changes.config.newValue)) applyLogin(changes.config.newValue);
        });
        DARK_DEVICE.addEventListener('change', updateLoginDark);

        //Keep the number label in step with the radio the user clicks (click and keyboard)
        let loginForm = document.querySelector('form[name="frmLogin"]');
        if (loginForm) {
            ['click', 'change'].forEach(function (eventName) {
                loginForm.addEventListener(eventName, function (event) {
                    if (event.target.name == 'numtype' && document.body.classList.contains('customLogin')) updateNumberLabel();
                });
            });
        }
    }

    /*=== Login page: accessibility (WCAG 2.2 AA) ===*/
    //The markup changes; the visual part (focus ring, text size, targets, contrast) is in
    //accessibility.css. Every change is reverted by revert('loginA11y')
    function loginAccessibility() {
        let root = document.documentElement;

        //Language of the page (3.1.1)
        if (!root.hasAttribute('lang')) setAttr('loginA11y', root, 'lang', 'en');

        //The login area is the page's main content (1.3.1)
        let area = document.querySelector('div.login');
        if (area && !area.hasAttribute('role')) setAttr('loginA11y', area, 'role', 'main');

        let form = document.querySelector('form[name="frmLogin"]');
        if (!form) return;

        //Radios (1.3.1, 2.5.8): each label names its radio, and clicking the label selects it
        let radios = Array.from(form.querySelectorAll('input[name="numtype"]'));
        radios.forEach(function (radio) {
            let label = radio.nextElementSibling;
            if (!label || label.tagName != 'LABEL' || label.htmlFor) return;
            if (!radio.id) setAttr('loginA11y', radio, 'id', 'ienablerNumtype' + radio.value);
            setAttr('loginA11y', label, 'for', radio.id);
        });

        //The radios as one group with a name (1.3.1): a fieldset whose legend only screen readers
        //read, so the page looks the same. The radios stay in the form, so the portal's set_it() works
        if (radios.length && radios.every(radio => radio.parentNode === radios[0].parentNode)) {
            let last = radios[radios.length - 1];
            let end = last.nextElementSibling && last.nextElementSibling.tagName == 'LABEL' ? last.nextElementSibling : last;
            let fieldset = document.createElement('fieldset');
            fieldset.className = 'ienablerRadioGroup';
            let legend = fieldset.appendChild(document.createElement('legend'));
            legend.className = 'ienablerVisuallyHidden';
            legend.textContent = 'Log in as';
            radios[0].before(fieldset);
            let node = radios[0];
            while (node) {
                let next = node.nextSibling;
                fieldset.appendChild(node);
                if (node === end) break;
                node = next;
            }
            undo.loginA11y.push(function () {
                legend.remove();
                fieldset.replaceWith(...fieldset.childNodes);
            });
        }

        //Number and PIN: what they are for (1.3.5), a number keypad for the PIN, and the hint read
        //out with the PIN (1.3.1)
        let unum = form.querySelector('input[name="unum"]');
        let pin = form.querySelector('input[name="pin"]');
        if (unum && !unum.hasAttribute('autocomplete')) setAttr('loginA11y', unum, 'autocomplete', 'username');
        if (!pin) return;
        if (!pin.hasAttribute('autocomplete')) setAttr('loginA11y', pin, 'autocomplete', 'current-password');
        if (!pin.hasAttribute('inputmode')) setAttr('loginA11y', pin, 'inputmode', 'numeric');
        let hint = pin.nextElementSibling && pin.nextElementSibling.tagName == 'P' ? pin.nextElementSibling : null;
        if (hint && !pin.hasAttribute('aria-describedby')) {
            if (!hint.id) setAttr('loginA11y', hint, 'id', 'ienablerPinHint');
            setAttr('loginA11y', pin, 'aria-describedby', hint.id);
        }
    }

    /*=== Main menu page: custom theme, custom colours and accessibility ===*/
    //The main menu page (mi_main_menu) holds two iframes: F1, the menu in the sidebar, and F3, the
    //content. This script runs in the page and in each frame, so every one looks after itself: it
    //sets classes on its own <html> ('ie-top', 'ie-f1' or 'ie-f3', plus 'ie-theme', 'ie-colours' and
    //'ie-a11y') for content.css, framef1.css, framef3.css and accessibility.css, and makes the
    //changes to the markup that CSS cannot. Everything applies and reverts live when the settings
    //change in the popup (chrome.storage.onChanged below), and F3 runs it again on every new page.
    //Which part of the main menu page this is: 'top', 'f1', 'f3', or null anywhere else
    function frameRole() {
        try {
            if (window === window.top) return currentURl.includes('mi_main_menu') ? 'top' : null;
            if (!window.parent.location.href.includes('mi_main_menu')) return null;
        } catch (e) {
            return null; //Framed by another site
        }
        return { F1: 'f1', F3: 'f3' }[window.name] || null;
    }

    //The Appearance settings. On these pages colours, accessibility, the colour scheme and hiding the
    //footer only apply with the modern look (customTheme), as on the login page (see applyLogin).
    //'dark' is the colour scheme worked out for this page:
    //Dark, or Automatic on a device set to dark
    function themeSettings(config) {
        let theme = setting(config, 'customTheme') === true;
        let scheme = setting(config, 'colourScheme') || 'auto';
        return {
            theme: theme,
            colours: theme && setting(config, 'customColors') === true,
            a11y: theme && setting(config, 'wgca') === true,
            dark: theme && (scheme == 'dark' || (scheme == 'auto' && DARK_DEVICE.matches)),
            noFooter: theme && setting(config, 'hideFooter') === true
        };
    }

    //Value of a setting by its name, or undefined. Stored settings are an array of [name, value]
    //(see config.js); reading them by name here means a config in an older order, such as one synced
    //from a computer that has not updated yet, never gives the wrong setting
    function setting(config, key) {
        let item = Array.isArray(config) ? config.find(entry => Array.isArray(entry) && entry[0] == key) : undefined;
        return item ? item[1] : undefined;
    }

    function applyConfig(config) {
        lastConfig = config;
        applySettings(themeSettings(config));
    }

    function applySettings(settings) {
        let root = document.documentElement;
        root.classList.add('ie-' + FRAME);

        //The accessibility changes are made on elements the theme adds or replaces (the subjects
        //table), so they come off before the theme changes and go back on after it
        let themeChanges = settings.theme != applied.theme;
        if (applied.a11y && (themeChanges || !settings.a11y)) {
            revert('a11y');
            root.classList.remove('ie-a11y');
            applied.a11y = false;
        }

        if (themeChanges) {
            if (settings.theme) {
                root.classList.add('ie-theme');
                ({ top: themeTop, f1: function () { }, f3: themeF3 })[FRAME]();
            } else {
                revert('theme');
                root.classList.remove('ie-theme');
            }
            applied.theme = settings.theme;
        }

        //Colours, the dark colour scheme and hiding the footer are CSS only
        root.classList.toggle('ie-colours', settings.colours);
        root.classList.toggle('ie-dark', settings.dark);
        root.classList.toggle('ie-no-footer', settings.noFooter);

        if (settings.a11y && !applied.a11y) {
            root.classList.add('ie-a11y');
            accessibility();
            applied.a11y = true;
        }
    }

    if (FRAME) {
        chrome.storage.onChanged.addListener(function (changes, areaName) {
            if (areaName == 'sync' && changes.config && Array.isArray(changes.config.newValue)) {
                applyConfig(changes.config.newValue);
            }
        });

        //Automatic colour scheme: follow the device when it switches between light and dark
        DARK_DEVICE.addEventListener('change', function () {
            if (lastConfig) applyConfig(lastConfig);
        });
    }

    /*== Revertible changes ==*/
    //Every change to the markup is made through these helpers, which keep a way to undo it in
    //undo.theme or undo.a11y. revert() undoes a group in reverse order, so the page goes back
    //exactly as it was, even when the same attribute was changed twice (see undo at the top)
    function revert(group) {
        while (undo[group].length) undo[group].pop()();
    }

    //Keep the current value of an attribute so revert() can bring it back
    function remember(group, element, name) {
        let original = element.getAttribute(name);
        undo[group].push(function () {
            if (original === null) element.removeAttribute(name);
            else element.setAttribute(name, original);
        });
    }

    function setAttr(group, element, name, value) {
        if (!element) return;
        remember(group, element, name);
        element.setAttribute(name, value);
    }

    //Add only the classes the element does not have yet
    function addClasses(group, element, names) {
        if (!element) return;
        let missing = names.filter(name => !element.classList.contains(name));
        if (missing.length) setAttr(group, element, 'class', ((element.getAttribute('class') || '') + ' ' + missing.join(' ')).trim());
    }

    function addNode(group, node, parent, atStart) {
        if (!parent) return;
        if (atStart) parent.prepend(node);
        else parent.appendChild(node);
        undo[group].push(() => node.remove());
    }

    function listen(group, target, type, handler) {
        target.addEventListener(type, handler);
        undo[group].push(() => target.removeEventListener(type, handler));
    }

    /*== Custom theme ==*/
    //Main menu page: the new WSU logo in the sidebar (the layout is in content.css)
    function themeTop() {
        let logo = document.querySelector('#mySidebar img') || document.images[0];
        if (!logo) return;
        ['height', 'width', 'style', 'src', 'class'].forEach(name => remember('theme', logo, name));
        logo.removeAttribute('height');
        logo.width = 270;
        logo.style.height = 'auto';
        logo.style.maxWidth = '90%';
        logo.src = chrome.runtime.getURL(WSU_LOGO_ON_DARK);
        logo.classList.add('wsuLogoOnDark');
    }

    //Content frame: classes for the controls (styled in framef3.css), the notice box and the subjects table
    function themeF3() {
        //Academic year, exam year, exam month and exam type
        ['x_cyr', 'x_exmcyr', 'x_exm1', 'x_et'].forEach(name => addClasses('theme', document.getElementsByName(name)[0], ['ienablerSelect']));
        //The first submit is the main action. Not the "Paste from Excel" button added above the form
        addClasses('theme', document.querySelector('input[type=submit]:not(#btnPaste)'), ['ienablerBtnPrimary', 'ienablerBtnRight']);
        document.querySelectorAll('input[type=button], input[type=reset], input[type=submit]').forEach(button => addClasses('theme', button, ['ienablerBtn']));

        //Notice box: the table after ErrorDiv holds the note text
        let errorDiv = document.getElementById('ErrorDiv');
        if (errorDiv) addClasses('theme', errorDiv.nextElementSibling, ['noticeBox']);

        subjectsTable();

        //overlib fills #overDiv again on every click on a subject; classes to style its pop-up menu
        listen('theme', document, 'click', function () {
            let tables = document.querySelectorAll('#overDiv table');
            if (tables.length == 4) {
                ['popUpLevel0', 'popUpHeader', 'popUpBody', 'popUpContent'].forEach((name, i) => tables[i].classList.add(name));
            }
        });
    }

    //Subjects table (the first .rltable): a real header, tooltips, and a search box that filters
    //the rows. The rows stay the portal's own elements, so the subject links (do_menu) work as
    //before. Reverting puts back a copy of the table taken before any change
    function subjectsTable() {
        let table = document.querySelector('table.rltable');
        let fakeHeader = table ? table.querySelector('tr.rlheader') : null;
        if (!fakeHeader) return;

        let original = table.cloneNode(true);

        //The portal's header is an ordinary row: make it a real <thead>
        let thead = document.createElement('thead');
        let headerRow = thead.appendChild(document.createElement('tr'));
        Array.from(fakeHeader.cells).forEach(function (cell) {
            headerRow.appendChild(document.createElement('th')).innerHTML = cell.innerHTML;
        });
        table.prepend(thead);
        fakeHeader.remove();

        table.id = 'tbSubjects';

        //Columns 2, 5 and 6 hold mark type codes
        table.querySelectorAll('tbody td:nth-child(2), tbody td:nth-child(5), tbody td:nth-child(6)').forEach(function (cell) {
            let code = cell.innerHTML;
            cell.setAttribute('data-placement', 'top');
            cell.setAttribute('data-toggle', 'Tooltip');
            cell.setAttribute('title', Object.prototype.hasOwnProperty.call(MARK_TYPES, code) ? MARK_TYPES[code] : 'Unknown Mark Type');
        });

        //What the search looks in for each row: the cell text, the tooltips and the subject name
        let rows = Array.from(table.tBodies).flatMap(tbody => Array.from(tbody.rows));
        let searchText = new Map();
        rows.forEach(function (row) {
            let words = [];
            Array.from(row.cells).forEach(function (cell) {
                words.push(cell.textContent);
                if (cell.title) words.push(cell.title);
            });
            let link = row.querySelector('a[onclick*="do_menu"]');
            let name = link ? subjectName(link.getAttribute('onclick')) : null;
            if (name) {
                if (!link.title) link.title = name;
                words.push(name);
            }
            searchText.set(row, words.join(' ').replace(/\s+/g, ' ').toLowerCase());
        });

        //Search box and result count, just above the table
        let tools = document.createElement('div');
        tools.className = 'ienablerTableTools';
        let label = tools.appendChild(document.createElement('label'));
        label.htmlFor = 'ienablerSearch';
        label.textContent = 'Search subjects';
        let search = tools.appendChild(document.createElement('input'));
        search.type = 'search';
        search.id = 'ienablerSearch';
        search.autocomplete = 'off';
        search.setAttribute('aria-controls', 'tbSubjects');
        //role="status" is read out politely by screen readers when its text changes
        let count = tools.appendChild(document.createElement('p'));
        count.className = 'ienablerCount';
        count.setAttribute('role', 'status');

        function countText(shown) {
            let total = rows.length;
            if (!search.value.trim()) return total + (total == 1 ? ' subject' : ' subjects');
            if (!shown) return 'No subjects match';
            return shown + ' of ' + total + (total == 1 ? ' subject' : ' subjects');
        }

        //Rows filter as you type; the count waits for a pause, so screen readers hear it once
        let countTimer = null;
        search.addEventListener('input', function () {
            let query = search.value.trim().replace(/\s+/g, ' ').toLowerCase();
            let shown = 0;
            rows.forEach(function (row) {
                row.hidden = !searchText.get(row).includes(query);
                if (!row.hidden) shown++;
            });
            clearTimeout(countTimer);
            countTimer = setTimeout(() => count.textContent = countText(shown), 300);
        });
        count.textContent = countText(rows.length);

        table.before(tools);
        undo.theme.push(function () {
            clearTimeout(countTimer);
            tools.remove();
            table.replaceWith(original);
        });
    }

    //Subject name: the 13th argument of the row's do_menu('2026','AEM37W0',...) call. The onclick
    //text is only read, never run. Every argument must be a quoted string, otherwise the row gets
    //no name (null) rather than a wrong one
    function subjectName(onclick) {
        let start = onclick ? onclick.indexOf('do_menu(') : -1;
        if (start < 0) return null;
        let text = onclick.slice(start + 'do_menu('.length);
        let args = [];
        let i = 0;
        while (true) {
            while (text[i] == ' ') i++;
            if (text[i] != "'") return null;
            let value = '';
            i++;
            while (i < text.length && text[i] != "'") {
                if (text[i] == '\\') i++; //Escaped character, such as \'
                value += text[i++] || '';
            }
            if (i >= text.length) return null; //No closing quote
            args.push(value);
            i++;
            while (text[i] == ' ') i++;
            if (text[i] == ')') break;
            if (text[i] != ',') return null;
            i++;
        }
        let name = args.length >= 13 ? args[12].trim() : '';
        return name || null;
    }

    /*== Improve accessibility (WCAG 2.2 AA) ==*/
    //The visual part (focus ring, target size, text size, contrast) is in accessibility.css
    function accessibility() {
        let root = document.documentElement;

        //Language of the page (3.1.1)
        if (!root.hasAttribute('lang')) setAttr('a11y', root, 'lang', 'en');

        //Alt text (1.1.1): spacers are decorative, the calendar button and the logo need a name
        document.querySelectorAll('img').forEach(function (image) {
            let src = image.getAttribute('src') || '';
            if (src.includes('join.gif') && !image.hasAttribute('alt')) setAttr('a11y', image, 'alt', '');
            else if (src.includes('calendar.gif') && !image.getAttribute('alt')) setAttr('a11y', image, 'alt', 'Choose date');
            else if ((src.includes('InsImg.gif') || image.classList.contains('wsuLogoOnDark')) && !image.getAttribute('alt')) setAttr('a11y', image, 'alt', 'Walter Sisulu University');
        });

        if (FRAME == 'top') accessibilityTop();
        if (FRAME == 'f1') keyboardButton(document.querySelector('div.w3-tag[onclick]')); //Logout
        if (FRAME == 'f3') accessibilityF3();
    }

    function accessibilityTop() {
        //Frame titles (4.1.2)
        let menu = document.getElementById('F1');
        let content = document.getElementById('F3');
        if (menu && !menu.title) setAttr('a11y', menu, 'title', 'Menu');
        if (content && !content.title) setAttr('a11y', content, 'title', 'Content');

        //Open and close buttons of the sidebar on small screens
        let openMenu = document.querySelector('a[onclick*="w3_open"]');
        if (openMenu && !openMenu.hasAttribute('aria-label')) setAttr('a11y', openMenu, 'aria-label', 'Open menu');
        keyboardButton(document.querySelector('#mySidebar i[onclick*="w3_close"]'), 'Close menu');

        //Skip link (2.4.1): moves the focus past the menu to the content frame
        if (!content) return;
        let skip = document.createElement('a');
        skip.href = '#F3';
        skip.className = 'ienablerSkip';
        skip.textContent = 'Skip to content';
        skip.addEventListener('click', function (event) {
            event.preventDefault();
            let page = content.contentDocument;
            let target = page ? page.querySelector('h1') || page.body : null;
            if (!target) {
                content.focus();
                return;
            }
            //The heading can take the focus only while it has a tabindex
            if (!target.hasAttribute('tabindex')) {
                target.setAttribute('tabindex', '-1');
                target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
            }
            content.contentWindow.focus();
            target.focus();
        });
        addNode('a11y', skip, document.body, true);
    }

    function accessibilityF3() {
        //Table headers (1.3.1): the portal's header rows are ordinary cells
        document.querySelectorAll('table.rltable tr.rlheader td').forEach(cell => setAttr('a11y', cell, 'role', 'columnheader'));
        document.querySelectorAll('thead th:not([scope])').forEach(cell => setAttr('a11y', cell, 'scope', 'col'));
        document.querySelectorAll('td.datahdr').forEach(cell => setAttr('a11y', cell, 'role', 'rowheader'));

        //Labels (1.3.1, 3.3.2): fields in the query forms are named by the datahdr cell in their row
        let count = 0;
        document.querySelectorAll('table.datadisp tr').forEach(function (row) {
            let header = row.querySelector('td.datahdr');
            if (!header) return;
            row.querySelectorAll('input:not([type=hidden]), select, textarea').forEach(function (field) {
                if ((field.labels && field.labels.length) || field.hasAttribute('aria-label') || field.hasAttribute('aria-labelledby')) return;
                if (!header.id) setAttr('a11y', header, 'id', 'ienablerLabel' + (++count));
                setAttr('a11y', field, 'aria-labelledby', header.id);
            });
        });
    }

    //Clickable element that is not a link or button (2.1.1): reachable with Tab, works with Enter and Space
    function keyboardButton(element, name) {
        if (!element) return;
        if (!element.hasAttribute('role')) setAttr('a11y', element, 'role', 'button');
        if (!element.hasAttribute('tabindex')) setAttr('a11y', element, 'tabindex', '0');
        if (name && !element.hasAttribute('aria-label')) setAttr('a11y', element, 'aria-label', name);
        listen('a11y', element, 'keydown', function (event) {
            if (event.key == 'Enter' || event.key == ' ') {
                event.preventDefault();
                element.click();
            }
        });
    }

    /*=== Paste from Excel ===*/
    //On the pages that enter the marks of many students at once, a button above the form fills
    //the mark fields from a column copied from Excel, in the order the students appear
    var markForm = document.querySelector('form[name="frmOne"]');
    var allMarksUrl = markForm ? markForm.getAttribute('action') : undefined;

    if (allMarksUrl == 'w26pkg.w26savemulti' || allMarksUrl == 'w06pkg.w06savemulti' || allMarksUrl == 'web.w06pkg.w06_upd_multi_proc') {
        //A plain button: it sits outside the form, so it never submitted anything
        var btnPaste = document.createElement('input');
        btnPaste.id = 'btnPaste';
        btnPaste.type = 'button';
        btnPaste.value = 'Paste from Excel';
        btnPaste.className = 'ienablerBtn ienablerBtnPrimary ienablerBtnRight';
        markForm.before(btnPaste);

        btnPaste.addEventListener('click', function () {
            var marks = window.prompt("Paste from Excel.\nPlease make sure the student marks are in the same order they appear on this page", "Marks");
            //Cancel gives null, which passes this check: fillUpFields then does nothing, but the page
            //still scrolls to the bottom, as it always has
            if (typeof marks !== 'undefined' && marks !== '') {
                fillUpFields(marks, allMarksUrl);
                window.scrollTo(0, document.body.scrollHeight + 50);
            }
        });
    }

    function removeExtraTabs(string) {
        return string.replace(new RegExp("\t\t", 'g'), "\t");
    }

    //Shown on the page, as jQuery's :visible (so hidden fields and type="hidden" are left out)
    function isVisible(element) {
        return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    }

    //Set a field's value by position; like jQuery's .eq(i).val(), a position past the end does nothing
    function setValue(fields, index, value) {
        if (fields[index]) fields[index].value = value;
    }

    function fillUpFields(marks) {
        if (marks == undefined) return;
        var data = removeExtraTabs(marks);
        var rows = data.split("\n"); //Get the rows from the excel

        //Get the list of inputs from the form
        var fieldList, fieldChanged;
        if (allMarksUrl == 'web.w06pkg.w06_upd_multi_proc') {
            fieldList = Array.from(document.querySelectorAll('input[name="x_multi_iahymark"]')).filter(isVisible);
            fieldChanged = Array.from(document.querySelectorAll('input[name="x_rec_changed"]'));
        } else {
            fieldList = Array.from(document.querySelectorAll('input[name="x_mark"]'));
        }

        var field = 0;

        //Compare the number of rows from the excel with the number od students in the page
        if (rows.length < fieldList.length) {
            const response = confirm('There are only ' + rows.length + ' marks from Excel and ' + fieldList.length + ' students on the page.\nOnly the first ' + rows.length + ' students will get marks. This normally means you selected the wrong spreadsheet or column.\nAre you sure you want to continue?');
            if (!response) return;
        }

        if (rows.length > fieldList.length) {
            const response = confirm('There are ' + rows.length + ' marks from Excel and only ' + fieldList.length + ' students on the page. This normally means you selected the wrong spreadsheet or column.\nThe last ' + (rows.length - fieldList.length) + ' marks from Excel will be ignored.\nAre you sure you want to continue?');
            if (!response) return;
        }

        for (var y = 0; y < rows.length; y++) { //For every row
            rows[y] = removeExtraTabs(rows[y]); //every column, but there should be only one column
            var cells = rows[y].split("\t"); //Content of the cell

            if (cells.length > 1) {
                alert("You must select only one column from excel.");
                return;
            }

            for (var x = 0; x < cells.length; x++) {
                setValue(fieldList, field, cells[x]); //fill up the input
                if (allMarksUrl == 'web.w06pkg.w06_upd_multi_proc') {
                    setValue(fieldChanged, field + 1, "Y");
                }
            }
            field++;
        }
    }
})();