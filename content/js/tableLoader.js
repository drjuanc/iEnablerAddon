//$( document ).ready(function() {

    var subjectTable = document.getElementById('tbSubjects');


    addThead(subjectTable); //Call de function that make a Thead  

    window.setTimeout( activateTable, 200 ); // delay 200 miliseconds to allow load all the libraries

    //add extra clases on  click of the table to allows customization of the popup
document.getElementById("tbSubjects").addEventListener("click", addClasses);

//If we are in the page of the subjects
if ($(subjectTable).length > 0) {
    //Add the attribute to all cells in columns 2,5 and 6 in the table tbSubjects 
    $('table#tbSubjects tbody td:nth-child(2), table#tbSubjects tbody td:nth-child(5), table#tbSubjects tbody td:nth-child(6)').attr({
        'data-placement': "top", 
        'data-toggle': "Tooltip"
    });

    let toolTip = $("[data-toggle=Tooltip]");   //Get all the cells with the tooltip attibute

    for (i = 0; i < toolTip.length; i++) {//Add the tooltip content in the attribute Title.
        switch (toolTip[i].innerHTML) {
            case "NF":
                toolTip[i].setAttribute("Title", "MTA - Nelson Mandela Drive");
                break;
            case "MD":
                toolTip[i].setAttribute("Title", "MD - End of Module Test");
                break;
            case "MR":
                toolTip[i].setAttribute("Title", "MR - POMR or Patient Presentation");
                break;
            case "TC":
                toolTip[i].setAttribute("Title", "TC - WSU Tutor Score");
                break;
            case "ET":
                toolTip[i].setAttribute("Title", "ET - End of Didactic Teaching Test");
                break;
            case "NW":
                toolTip[i].setAttribute("Title", "NW - Learing Need Worksheet");
                break;
            case "OS":
                toolTip[i].setAttribute("Title", "OS - OSCE Mark");
                break;
            case "LB":
                toolTip[i].setAttribute("Title", "LB - Procedure Logbook");
                break;
            case "DP":
                toolTip[i].setAttribute("Title", "DP - District Hospital Score");
                break;
            case "LC":
                toolTip[i].setAttribute("Title", "LC - Elective mark");
                break;
            case "0":
                toolTip[i].setAttribute("Title", "Year mark");
                break;
            case "S1":
                toolTip[i].setAttribute("Title", "S1 - Supplementary exam");
                break;
            default:
                toolTip[i].setAttribute("Title", "Unknown Mark Type");
                
        }
    }


}


   //Activate the table with Boostrap table
    function activateTable(){
        var $table = $('#tbSubjects');
        if ($table.length > 0) {
            $table.bootstrapTable({});
            //remove the extra classes inserted by default by the table module
            subjectTable.classList.remove('table-striped', 'table-bordered');
        }
        //Hide the overDiv with the tip because interfiere with the hover
        $('#overDiv').css('visibility', 'hidden');
        $('.float-right').last().removeClass('float-right');
    }

    function addThead(onTable){
    
        fakeHeader = onTable.getElementsByClassName("rlheader")[0];//Get the fake header
        var realHeader = [];
    
        for (var i = 0, cell; cell = fakeHeader.cells[i]; i++) {
            realHeader.push(cell.innerHTML);
       }
    
        //Add the real Theader
        var thead = document.createElement('thead');
        //onTable.appendChild(thead);
        onTable.prepend(thead);
        var tr = thead.appendChild(document.createElement("tr"));
        /*for (var i=0; i<realHeader.length; i++) {
            thx = document.createElement("th");
            tr.appendChild(thx).
                appendChild(document.createTextNode(realHeader[i]));
                //console.log(th);
                thx.setAttribute("data-field", realHeader[i].split(' ')[0]+i);
        }*/
        for (var i=0; i<realHeader.length; i++) {
            tr.appendChild(document.createElement("th")).
                  appendChild(document.createTextNode(realHeader[i]));
        }
      
        fakeHeader.remove();
        }

   
   //Add extra classes to the popUp menu
   function addClasses(){
        /*Popup with the menu*/
        var popUpDiv = document.getElementById('overDiv');

        if (popUpDiv){
            level1Table = popUpDiv.getElementsByTagName('table');
            if(level1Table && level1Table.length ==4){
                level1Table[0].classList.add("popUpLevel0");
                level1Table[1].classList.add("popUpHeader");
                level1Table[2].classList.add("popUpBody");
                level1Table[3].classList.add("popUpContent");

                //console.log(level1Table[0]);
            }
        
        }
   }

//});