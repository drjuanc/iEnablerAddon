/* This is very hacky but I couldn't figure out any other way*/
function frameF3Reloaded(tableLoader){
/*Inserting all the CSS and JS files needed everytime the frame changes*/
/*The files names came in a sesion var in the form of long string 
separated by coma so I made then again an array*/
    
    arrFiles = sessionStorage.getItem("filesToAttach").split(",");

    for (x in arrFiles){
        if(arrFiles[x].includes('.css')) {
            
            var cssFile = document.createElement('link'); //Custom CSS file
            cssFile.href = arrFiles[x];
            cssFile.rel = "stylesheet";
            cssFile.type = "text/css";
            frames['F3'].document.head.appendChild(cssFile);

        }
        if(arrFiles[x].includes('.js')) {
            var jsFile = document.createElement('script');
            jsFile.src = arrFiles[x];
            jsFile.type = "text/javascript";
            //console.log(jQuery);
            frames['F3'].document.body.appendChild(jsFile);
            //console.log(arrFiles[x]);
        }
    }

    /* ==== Injecting all the clases needed to apply boostrap and custom styles === */
    /*Forms styles*/
    var academicYear = frames['F3'].document.getElementsByName('x_cyr');
    var examYear = frames['F3'].document.getElementsByName('x_exmcyr');
    var examMonth = frames['F3'].document.getElementsByName('x_exm1');
    var examType = frames['F3'].document.getElementsByName('x_et');
    var btnSubmit = frames['F3'].document.querySelectorAll('input[type=submit]');
    var btnButton = frames['F3'].document.querySelectorAll('input[type=button], input[type=reset], input[type=submit]');

    //Insert the clases only if the object exist
    if (academicYear.length > 0) academicYear[0].classList.add("form-select");
    if (examYear.length > 0) examYear[0].classList.add("form-select");
    if (examMonth.length > 0) examMonth[0].classList.add("form-select");
    if (examType.length > 0) examType[0].classList.add("form-select");
    if (btnSubmit.length > 0) btnSubmit[0].classList.add("btn-primary", "btn-right");

    btnButton.forEach((element) => {
        element.classList.add("btn");
    });
    /*Notice box*/
    var errorDiv = frames['F3'].document.getElementById('ErrorDiv'); 
    if (errorDiv) { //if the box exist
        errorDiv.nextElementSibling.classList.add("noticeBox");//Adding class to the table with the notetext
    }


    //Table with the list of subjects
    var tableSubjects = frames['F3'].document.querySelectorAll('.rltable');
    
        if (tableSubjects.length > 0) { // If the table is exist        
        tableSubjects[0].setAttribute("id", "tbSubjects");
        tableSubjects[0].setAttribute("data-toggle", "tbSubjects");
        tableSubjects[0].setAttribute("data-search", "true");
        tableSubjects[0].classList.add("table", "table-striped");
        //addThead(tableSubjects[0]); 
        
        

        //After a few miliseconds I insert the table loader file, 
        //because inline JS is not allowed in the extensions
        window.setTimeout( addTableLoader(tableLoader), 100 ); // 0.1 seconds


        window.overlib=function(){};
        document.removeEventListener('mousemove', olMouseMove, false);
        frames['F3'].document.removeEventListener('mousemove', olMouseMove, false);
        function addTableLoader(tableLoader){
            //Finally I initialize the table
            var fileTableLoader = document.createElement('script');
            fileTableLoader.src = tableLoader;
            fileTableLoader.type = "text/javascript";
            frames['F3'].document.body.appendChild(fileTableLoader);
        }
    }

 
    //console.log(frames['F3'].location.href);
    //Page enter Exam marks to select the exam: //w24pkg.w24getDetail?x_jektype 
    //Page exam list: w24pkg.w24setDetail
    //Page View marks: w24pkg.w24viewmarks
    //Page enter marks: w26entermarks?
    //Page Individual marks:w24pkg.w24manual
}

 