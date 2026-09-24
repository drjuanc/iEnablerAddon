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
    const undo = { theme: [], a11y: [] };

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
        if (FRAME) applySettings(themeSettings(arrConfig));

        //Custom login, if i'm in the login page
        if (currentURl.includes('mi_login')) {
            let docBody = document.body;
            //Activate the custom login adding a class to the body
            if (arrConfig[3][0] == 'customLogin' && arrConfig[3][1]) docBody.classList.add("customLogin");

            //Activate the custom login colors adding a class to the body
            if (arrConfig[4][0] == 'customLoginColors' && arrConfig[4][1]) docBody.classList.add("customLoginColors");

            //Fix WSU logo. If the option is active I call the function
            if ((arrConfig[5][0] == 'fixWSULogo' && arrConfig[5][1]) && (arrConfig[3][1])) fixWSULogo(360);

            //CleanLogin
            if ((arrConfig[7][0] == 'cleanLogin' && arrConfig[7][1]) && (arrConfig[3][1])) docBody.classList.add("cleanLogin");

            //Remove the margin of the main div
            document.getElementsByClassName('w3-main')[0].removeAttribute('style');

            //Keep the number label in step with the radio the user clicks (click and keyboard)
            var loginForm = document.querySelector('form[name="frmLogin"]');
            if (loginForm) {
                ['click', 'change'].forEach(function (eventName) {
                    loginForm.addEventListener(eventName, function (event) {
                        if (event.target.name == 'numtype' && document.body.classList.contains('customLogin')) updateNumberLabel();
                    });
                });
            }

            //Login header, PIN label, number label and the missing space in the pin hint
            if (arrConfig[3][1]) fixLoginTexts();

            //Select the user type by default
            if ((arrConfig[6][0] == 'userTypeDef' && arrConfig[6][1]) && (arrConfig[3][1]) && arrConfig[9] && arrConfig[9][0] == 'userType') selectUserType(arrConfig[9][1]);
        }

    });


    //Replace the low-res WSU logo on the login page with the new one, keeping its aspect ratio.
    //Keep the width in step with fixWSULogo in background.js. The main menu logo is in themeTop
    function fixWSULogo(logoWidth) {

        var wsuLogo = document.getElementsByTagName("img")[0];
        if (!wsuLogo) return;
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

    //Used by the functions background.js injects when the popup settings change
    window.iEnablerLogin = {
        apply: fixLoginTexts,
        restore: restoreLoginTexts,
        selectUserType: selectUserType
    };

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

    //The three switches. Colours and accessibility only apply with the custom theme, as in the popup
    function themeSettings(config) {
        let isOn = (index, key) => Array.isArray(config) && Array.isArray(config[index]) && config[index][0] == key && config[index][1] === true;
        let theme = isOn(0, 'customTheme');
        return { theme: theme, colours: theme && isOn(1, 'customColors'), a11y: theme && isOn(2, 'wgca') };
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

        //Colours are CSS only
        root.classList.toggle('ie-colours', settings.colours);

        if (settings.a11y && !applied.a11y) {
            root.classList.add('ie-a11y');
            accessibility();
            applied.a11y = true;
        }
    }

    if (FRAME) {
        chrome.storage.onChanged.addListener(function (changes, areaName) {
            if (areaName == 'sync' && changes.config && Array.isArray(changes.config.newValue)) {
                applySettings(themeSettings(changes.config.newValue));
            }
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

    //Content frame: Bootstrap, form and button classes, the notice box and the subjects table
    function themeF3() {
        ['lib/css/bootstrap.min.css', 'lib/css/bootstrap-table.min.css'].forEach(function (file) {
            let link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = chrome.runtime.getURL(file);
            addNode('theme', link, document.head);
        });

        //Academic year, exam year, exam month and exam type
        ['x_cyr', 'x_exmcyr', 'x_exm1', 'x_et'].forEach(name => addClasses('theme', document.getElementsByName(name)[0], ['form-select']));
        //The first submit is the main action. Not the "Paste from Excel" button added above the form
        addClasses('theme', document.querySelector('input[type=submit]:not(#btnPaste)'), ['btn-primary', 'btn-right']);
        document.querySelectorAll('input[type=button], input[type=reset], input[type=submit]').forEach(button => addClasses('theme', button, ['btn']));

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

    //Subjects table (the first .rltable): a real header, mark type tooltips, and Bootstrap Table
    //for searching. Reverting puts back a copy of the table taken before any change
    function subjectsTable() {
        let table = document.querySelector('table.rltable');
        let fakeHeader = table ? table.querySelector('tr.rlheader') : null;
        if (!fakeHeader || !$.fn.bootstrapTable) return;

        let original = table.cloneNode(true);

        //The portal's header is an ordinary row: make it a <thead> so Bootstrap Table finds the columns
        let thead = document.createElement('thead');
        let headerRow = thead.appendChild(document.createElement('tr'));
        Array.from(fakeHeader.cells).forEach(function (cell) {
            headerRow.appendChild(document.createElement('th')).innerHTML = cell.innerHTML;
        });
        table.prepend(thead);
        fakeHeader.remove();

        table.id = 'tbSubjects';
        table.setAttribute('data-search', 'true');
        table.classList.add('table', 'table-striped');

        //Columns 2, 5 and 6 hold mark type codes
        table.querySelectorAll('tbody td:nth-child(2), tbody td:nth-child(5), tbody td:nth-child(6)').forEach(function (cell) {
            let code = cell.innerHTML;
            cell.setAttribute('data-placement', 'top');
            cell.setAttribute('data-toggle', 'Tooltip');
            cell.setAttribute('title', Object.prototype.hasOwnProperty.call(MARK_TYPES, code) ? MARK_TYPES[code] : 'Unknown Mark Type');
        });

        let $table = $(table);
        $table.bootstrapTable({});
        //Remove the extra classes Bootstrap Table adds by default
        table.classList.remove('table-striped', 'table-bordered');
        //Search box on the left
        $table.closest('.bootstrap-table').find('.float-right').last().removeClass('float-right');

        undo.theme.push(function () {
            try {
                $table.bootstrapTable('destroy');
            } catch (e) {
                //The copy below replaces whatever is left
            }
            (table.closest('.bootstrap-table') || table).replaceWith(original);
        });
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

    //This section paste from excel funtionality
    var markForm = $('form[name="frmOne"]').eq(0);
    var allMarksUrl = markForm.attr('action');
    
    if (allMarksUrl == 'w26pkg.w26savemulti' || allMarksUrl == 'w06pkg.w06savemulti' || allMarksUrl == 'web.w06pkg.w06_upd_multi_proc') {

        $('form[name="frmOne"]').eq(0).before('<input id = "btnPaste" type="submit" value="Paste from Excel" onclick="#" class="btn btn - primary btn - right">');

    }

    $('#btnPaste').click(function () {
        var marks = window.prompt("Paste from Excel.\nPlease make sure the student marks are in the same order they appear on this page", "Marks");
        if (typeof marks !== 'undefined' && marks !== '') {
            fillUpFields(marks, allMarksUrl);
            window.scrollTo(0, document.body.scrollHeight + 50);
        }
    });

    function removeExtraTabs(string) {
        return string.replace(new RegExp("\t\t", 'g'), "\t");
    }

    function fillUpFields(marks) {
        if (marks == undefined) return;
        var data = removeExtraTabs(marks);
        var rows = data.split("\n"); //Get the rows from the excel

        //Get the list of inputs from the form
        if (allMarksUrl == 'web.w06pkg.w06_upd_multi_proc') {
            var fieldList = $('input[name="x_multi_iahymark"]:not(:hidden)');
            var fieldChanged = $('input[name="x_rec_changed"]'); 
        } else {
            var fieldList = $('input[name="x_mark"]');
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


        for (var y in rows) { //For every row
            rows[y] = removeExtraTabs(rows[y]); //every column, but there should be only one column
            var cells = rows[y].split("\t"); //Content of the cell

            if (cells.length > 1) {
                alert("You must select only one column from excel.");
                return;
            }

            for (var x in cells) { 
                fieldList.eq(field).val(cells[x]); //fill up the input
               if (allMarksUrl == 'web.w06pkg.w06_upd_multi_proc') {
                   fieldChanged.eq(field+1).val("Y");
                }

                
            }
            field++;

        }
    }
})();