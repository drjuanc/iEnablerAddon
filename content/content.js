(() => {



    let currentURl = window.location.href; //Get the page URL
    let arrConfig; //Set the var config

    //New WSU logo, and the version shown on the dark sidebar of the main menu.
    //There is no official light logo yet, so the sidebar uses the same file turned white by
    //--logoOnDarkFilter in variables.css. When an official one arrives, point WSU_LOGO_ON_DARK
    //at it and set --logoOnDarkFilter to 'none'.
    const WSU_LOGO = 'assets/pics/wsu-logo-new.png';
    const WSU_LOGO_ON_DARK = 'assets/pics/wsu-logo-new.png';
   

   //I read all settings and stored in a abject containing an array of propertyes
    chrome.storage.sync.get(function (result) {

        arrConfig = result.config;
        if (!Array.isArray(arrConfig)) return; //No settings stored yet
        /*==Now I read every individual configation and act accordingly==*/
        //Custom theme

        if (arrConfig[0][0] == 'customTheme' && !currentURl.includes('mi_login')) {
            if (arrConfig[0][1]) {
                //Activate the custo Theme adding a class to the body
                var docBody = document.body;
                docBody.classList.add("customTheme");
            } else {
                //no need to deactivate the custom theme
                //
            }

        }

        //Custom login, if i'm in the login page
        if (currentURl.includes('mi_login')) {
            let docBody = document.body;
            //Activate the custom login adding a class to the body
            if (arrConfig[3][0] == 'customLogin' && arrConfig[3][1]) docBody.classList.add("customLogin");

            //Activate the custom login colors adding a class to the body
            if (arrConfig[4][0] == 'customLoginColors' && arrConfig[4][1]) docBody.classList.add("customLoginColors");

            //Fix WSU logo. If the option is active I call the function
            if ((arrConfig[5][0] == 'fixWSULogo' && arrConfig[5][1]) && (arrConfig[3][1])) fixWSULogo(360);

            //Select personnel as default option
            if ((arrConfig[6][0] == 'personnelDef' && arrConfig[6][1]) && (arrConfig[3][1])) document.getElementsByName('numtype')[1].checked = true;;

            //CleanLogin
            if ((arrConfig[7][0] == 'cleanLogin' && arrConfig[7][1]) && (arrConfig[3][1])) docBody.classList.add("cleanLogin");

            //Remove the margin of the main div
            document.getElementsByClassName('w3-main')[0].removeAttribute('style');

            //Shorter login header and the missing space in the pin hint
            if (arrConfig[3][1]) fixLoginTexts();
        }

        if (currentURl.includes("mi_main_menu")) { //Make sure the user is in the other page
            //Fix wsu logo, still need the condition in case te option is active
            fixWSULogo(270);

            //var iframeF3 = document.
            //onload="myonloadscript()
        }


    });


    //Replace the low-res WSU logo with the new one, keeping its aspect ratio.
    //Keep the login width in step with fixWSULogo in background.js
    function fixWSULogo(logoWidth) {

        var wsuLogo = document.getElementsByTagName("img")[0];
        if (!wsuLogo) return;
        wsuLogo.removeAttribute('height');
        wsuLogo.width = logoWidth;
        wsuLogo.style.height = 'auto';
        wsuLogo.style.maxWidth = '90%';

        if (currentURl.includes("mi_login")) { //Make sure the user is in login page
            wsuLogo.src = chrome.runtime.getURL(WSU_LOGO);
        }


        if (currentURl.includes("mi_main_menu")) { //Make sure the user is in the other page
            wsuLogo.src = chrome.runtime.getURL(WSU_LOGO_ON_DARK);
            wsuLogo.classList.add('wsuLogoOnDark');
        }

    }

    //Login page wording. The original text is kept in data-ienabler-original so
    //removeCustomLogin in background.js can bring it back. Keep both in step.
    function fixLoginTexts() {
        document.querySelectorAll('header.w3-blue h5').forEach(function (header) {
            if (header.textContent.trim() == 'Registered Users: Login Credentials') {
                header.dataset.ienablerOriginal = header.textContent;
                header.textContent = 'Login Credentials';
            }
        });

        var pin = document.querySelector('form[name="frmLogin"] input[name="pin"]');
        var hint = pin ? pin.nextElementSibling : null;
        var hintText = hint && hint.tagName == 'P' ? hint.firstChild : null;
        if (hintText && hintText.nodeType == Node.TEXT_NODE && hintText.nodeValue.includes('digits.Do')) {
            hint.dataset.ienablerOriginal = hintText.nodeValue;
            hintText.nodeValue = hintText.nodeValue.replace('digits.Do', 'digits. Do');
        }
    }

    document.addEventListener('readystatechange', event => {

        //When the document is loaded and  I'm not in the login

        if (event.target.readyState === "complete" && currentURl.includes("mi_main_menu")) {

            /*=== Add the google forms to the file ===*/
            var googleFont = document.createElement('link');
            googleFont.href = chrome.runtime.getURL('assets/fonts/RobotoCondensed-Regular.ttf');
            googleFont.rel = "stylesheet";

            /*=== link the CSS to the iframe===*/
            //Create the F1 and F3 css object
            var framef1CSS = document.createElement('link');
            var framef3CSS = document.createElement('link');
            var framef3JS = document.createElement('script');

            //Insert the css and JS needed
            framef1CSS.href = chrome.runtime.getURL('content/css/framef1.css');
            framef3CSS.href = chrome.runtime.getURL('content/css/framef3.css');
            framef3JS.src = chrome.runtime.getURL('content/js/frameF3Loader.js');

            framef1CSS.rel = "stylesheet";
            framef3CSS.rel = "stylesheet";

            framef1CSS.type = "text/css";
            framef3CSS.type = "text/css";
            framef3JS.type = "text/javascript";

            //Insert the CSS's into the head of the Iframe document
            frames['F1'].document.head.appendChild(framef1CSS);
            frames['F3'].document.head.appendChild(framef3CSS);

            document.head.appendChild(framef3JS);
           // var files = "'"+framef3CSS.href + "', '" + bootStrapCSS+"'";

            /*I'm not happy with this, too hacky: I add made an array with all the files I need to insert in the iFrame3
            Then store the array in a session var, that made a long sting separated by comas*/

            //Here I create an array of files I need to attach to the frame #3
            var jQueryJS = chrome.runtime.getURL('lib/js/jquery.min.js');
            var bstBundle = chrome.runtime.getURL('lib/js/bootstrap.bundle.min.js');
            var tableLoader = chrome.runtime.getURL('content/js/tableLoader.js');
            
            var bstCSS = chrome.runtime.getURL('lib/css/bootstrap.min.css');
            var bstTableCSS = chrome.runtime.getURL('lib/css/bootstrap-table.min.css');
            var bstTableJS = chrome.runtime.getURL('lib/js/bootstrap-table.min.js');

           // var jQueryTooTip = chrome.runtime.getURL('lib/js/jquery-ui.min.js');
           

            var attfiles = [framef3CSS.href, bstCSS, bstTableCSS, jQueryJS, bstBundle, bstTableJS];
            //console.log(jQueryJS);
            sessionStorage.setItem("filesToAttach", attfiles); //Store them in a session var
            
           document.getElementById("F3").setAttribute("onLoad", "frameF3Reloaded('"+tableLoader+"');");

           

        }
    });

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