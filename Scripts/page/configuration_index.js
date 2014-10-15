/*---------------------------------------------------------------\
+
+ Project     : Perimeter Intrusion Detection System
+ Filename    : configuration_index.js
+ Module Name : Script for configuration Page.
+ Coded By    : Deepak Arora
+ Date        : Jun 11, 2012 19:43:33 2010 -0500
+  
+---------------------------------------------------------------*/

//#region Variable Declaration
/*
* Variable declaration
*/
var filterPopup = null; //variable for all the popup
var closeButton = null; //button close the popup
var showField = null; //buton is visible for sensor panel in menubar, fielsd information(zone) opener
var current = null; // variable to fined current active panel with tree-view functionality
var textToSearch = null; // return enter text in search box of sensor panel for zone popup
var textSearchProfile = null; // return enter text in search box of sensor panel foe profile popup
var filterZoneContainer = null; //variable containe run time generated zone information
var filterProfilesContainer = null; //variable containe run time generated profile information
var fieldDescription = null; // pop up which contain field details for popup[zone, profile] in sensor panel
var fieldContentZone = null; // contain run time generated input button and zone name in zone pop up
var fieldContentProfile = null; // contain run time generated input button and profile name in profile pop up
var getActiveZoneName = null; //apply button in zone popup[get active zone value]
var getActiveProfileName = null; //apply button in profile popup[get active profile value]
var zoneJson = [];
var profileJson = [];
var siteId = null;
var objSelected = null;
var editByManage = false;
var removeRollover = false;
var getglobalid;

//#endregion

/*
* Code to run when the page gets ready.
*/
$(function () {
    newEvents();

    // Binding the enter key submit with the forms.
     $('form').each(function() {
        var form = $(this);        
        $('input',form).keypress(function(e) {
            // Enter pressed?            
            if(e.which == 10 || e.which == 13) { 
                var frmId = form.attr('id');              
                if(frmId == 'frmProfileCreate')                
                    createProfile();                
                else if(frmId == 'frmProfileEdit')                
                    updateProfile();
            }
        });
    });

    $(".contentDescripation[rel='add']").show();
    configurationAction();

    // Initialize the trre view on page.
    $("#treeview").treeview({ animated: "slow", collapsed: true, unique: false, toggle: function () { }});
    
    // Get the profiles.
    getProfiles();

    // This will make sure that element having this class will allow only numeric input.
    jQuery('.numbersOnly').keydown(function(event) {
        // Allow: backspace, delete, tab, escape, and enter
        if ( event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 27 || event.keyCode == 13 || 
             // Allow: Ctrl+A
            (event.keyCode == 65 && event.ctrlKey === true) || 
             // Allow: home, end, left, right
            (event.keyCode >= 35 && event.keyCode <= 39)) {
                 // let it happen, don't do anything
                 return;
        }
        else {
            // Ensure that it is a number and stop the keypress
            if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105 )) {
                event.preventDefault(); 
            }   
        }
    });
});

$(window).load(function() {
    // Closes the user messages.
    closeMessage(); 
});

//#region Profile Related function ////
/*
* Getting the profile data from server.
*/
function getProfiles() {
     // Getting the profile data from server.
    $.ajax({
        url: "/Configuration/GetProfiles",        
        cache:false,
        success: function (result, textStatus, jqXHR) {
            profileJson = result.data;
            updateProfileBox(profileJson);
        },
        error: function() {
        }
    });
}


/*
* show profile popup, calculate current toolbar button position and show popup according to button
* divya.
*/
function profilePopup() {
    var pPopupHeight = null;
    $(".profileDetails").click(function (e) {
        
        if($('.profilePopup').css('display') != 'none')
        {
            $('.profilePopup').hide();
            $(this).removeClass('fieldActive');
            return;
        }              
        e.stopPropagation();
        var position = $(this).offset(); //profile button position
        $(".profilePopup").css({ "left": position.left-3, "top": position.top+23 }).show();        
        $(".profilePopup").find(".searchListBox").focus().val("").trigger('keyup');
        // calculate height of profile popup
        pPopupHeight = fieldContentProfile.find(".fHead").outerHeight() + fieldContentProfile.find(".fsearch").outerHeight() + fieldContentProfile.find(".fList").outerHeight() + fieldContentProfile.find(".fFoot").outerHeight() + fieldContentProfile.find(".footCreate").outerHeight() + fieldContentProfile.find(".footManage").outerHeight() +18;
        $(".profilePopup").css("height", pPopupHeight +'px');
        //console.log("2");
    });
}

// Profile popup edit hover action
// divya
function editOnHover(){
    $(".fListContent").hover(function(){
        $(this).find(".editProfile").show();
    },function(){
        $(this).find(".editProfile").hide();
    }
    );
}

/*
 * This function call when hover on a profile
 * divya
*/
function profileClickAction() {
    $(".profilePopup>.fieldLabel").find(".fList").find(".fListContent").hover(function (event) {
    var thisObj = $(this).offset();
    var position = $(".profilePopup").offset();
        for (var i = 0; i < profileJson.length; i++) {
            if ($(this).find(":radio").attr('id') == profileJson[i].pname) {
                stringHtml = "<div class='tribox'><img src='../../Content/css/images/icons/tribox.png' /></div><div class='tableDiv'><table class='tooltipTable' cellpadding='0' cellspacing='0'><tr><td>Sampling Rate</td><td>" + profileJson[i].sr + "</td></tr><tr><td>Sensitive level</td><td>" + profileJson[i].sens + "</td></tr><tr><td>Threshold Value</td><td>" + profileJson[i].thres + "</td></tr></table></div>";
                $("<div id='tempTooltip'></div>").html(stringHtml).appendTo('body').css({'top': (thisObj.top - 15) + 'px' , 'left': (position.left + 235) +'px' , 'position':'absolute'}).fadeIn('slow'); //create tooltip div
            }
        }
    }, function () {
        $('#tempTooltip').remove();      
    });
}

/*
* This method updates the profile on a particular sensor.
* 
*/
function updateSensorProfile(senId,profileId, type) {
    var url = "/Configuration/ApplySensorProfile?objId=" + senId + "&profileId=" + profileId + "&siteId=" + $(objSelected).attr('sid') + "&type=" + type;

    // Sensor profile in case of vsiu and zone.
    if (type != 'sensor')
        url= "/Configuration/ApplyObjectProfile?objId=" + senId + "&profileId=" + profileId + "&siteId=" + $(objSelected).attr('sid') + "&type=" + type;
    
    $.ajax({
        url: url,
        cache:false,
        success: function (result, textStatus, jqXHR) {
            if (result.status == "True" || result.status == true) {
                if (type == 'sensor') {
                    objSelected.attr('sampling', result.profile.sr);
                    objSelected.attr('sensitivity', result.profile.sens);
                    objSelected.attr('thres', result.profile.thres);

                    // This will fill the new profile setting of the sensor in right panel.
                    objSelected.trigger('click');                    
                    showMessage({ 'msg': 'Sensor profile updated successfully. Reloading the page...', 'autoClose': true, 'className': 'success' });
                    setTimeout("location.reload()",3000);
                }
                else {
                    objSelected.find();
                    showMessage({ 'msg': type +' profile updated successfully. Reloading the page...', 'autoClose': true, 'className': 'success' });
                    setTimeout("location.reload()",3000);                    
                }                
            }
            else if (result.status == "False" || result.status == false) {
                showMessage({ 'msg': 'Server error occured when applying profile.', 'autoClose': true, 'className': 'fail' });
                setTimeout("closeMessage()",3000);
            }
            else {
                showMessage({ 'msg': result.msg, 'autoClose': true, 'className': 'fail' });
                setTimeout("closeMessage()",3000);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
             showMessage({ 'msg': 'Server error occured when applying profile.', 'autoClose': true, 'className': 'fail' });
             setTimeout("closeMessage()",3000);
        },
       complete: function (jqXHR, textStatus) {
            //closeMessage();
        }
    });
}

/*
* This function is used to create profile.
*/
function createProfile(form) {
    var form = $('#frmProfileCreate');
    $('.fieldActive').removeClass('fieldActive');

    form.validate({
        rules: {
            pname: "required",
            psamp: { required: true, number: true},
            psens: { required: true, number: true},
            pthres: { required: true, number: true}
        },
        messages: {
            pname: "*",
            psamp: { required: "*", number: "Invalid" },
            psens: { required: "*", number: "Invalid" },
            pthres: { required: "*", number: "Invalid" }
        }
    });

    if (form.valid()) {
        var status = 0;
        for (var i = 0; i < profileJson.length; i++) {          
            if(profileJson[i].pname.toLowerCase() ==  $('#frmProfileCreate').find('input[name=pname]').val().toLowerCase()) {
                status = 1;
                break;
            }
        }
        if(status == 1) {           
            showMessage({ 'msg': 'There is already a profile with same name. Kindly use different name for new profile.', 'autoClose': true, 'className': 'fail' });
            setTimeout("closeMessage()",3000);
            return false;
        }
        
        $.ajax({
            url: "/Configuration/CreateProfile",
            type: "post",
            cache:false,
            data: $('#frmProfileCreate').serialize(),
            success: function (result, textStatus, jqXHR) {
                if(result.status == "True" || result.status == true ) {
                    getProfiles();                  
                    showMessage({ 'msg': 'Profile Created successfully.', 'autoClose': true, 'className': 'success' });                    
                }
                else   {
                    showMessage({ 'msg': result.msg, 'autoClose': true, 'className': 'fail' });
                }
            },
            error : function(err) {             
                showMessage({ 'msg': 'Some server problem occured when creating new profile.', 'autoClose': true, 'className': 'fail' });
            },
            complete : function(result) {                   
                hideForm('pFrmCreate');                     
            }
        });
    }
    form.find('input:first').focus();
    return false;  
}

/*
* This function is used to update profile.
*/
function updateProfile() {    
    var form = $('#frmProfileEdit');
    form.validate({
        rules: {
            pname: "required",
            psamp: { required: true, number: true },
            psens: { required: true, number: true },
            pthres: { required: true, number: true },
        },
        messages: {
            pname: "*",
            psamp: { required: "*", number: "Invalid" },
            psens: { required: "*", number: "Invalid" },
            pthres: { required: "*", number: "Invalid" }
        }
    });

    if (form.valid()) {
        $.ajax({
            url: "/Configuration/UpdateProfile",
            type: "post",
            cache:false,
            data: form.serialize(),
            success: function (result, textStatus, jqXHR) {
                if(result.status == "True" || result.status == true ) {
                    getProfiles();              
                    showMessage({ 'msg': 'Profile Updated successfully', 'autoClose': true, 'className': 'success' });                    
                }
                else   {
                    showMessage({ 'msg': result.msg, 'autoClose': true, 'className': 'fail' });                   
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                showMessage({ 'msg': 'Some server problem occured when updating profile.', 'autoClose': true, 'className': 'fail' }); 
            },
            complete : function(result) {   
                hideForm('pFrmEdit');                          
            }
        });
    }
    form.find('input:first').focus();
    return false;
}
/*
* Description: hide profile form popup
* Parameter: popupId= form popup id witch will hide
*/
function showFormPopup(popupId) { 
    var frmPopup = $("#" + popupId);
    var profileForm = $(".showOuter");
    var disablePage = $('#loadingbg');
    profileForm.hide();        
    frmPopup.show();
    disablePage.show();
    frmPopup.find('input:first').focus();
}

/* 
*  Description: open a popup witch shows current profile details 
*  Parameter: editId= unique value of edit link, frmPopup= edit popup id
*/
function editProfile(editId, frmPopup) {    
    $(frmPopup).find('input[name=hidPID]').val(editId);
    for (var i = 0; i < profileJson.length; i++) {        
        if (editId == profileJson[i].pid) {
            frmPopup.find('input[name=pname]').val(profileJson[i].pname);
            frmPopup.find('input[name=psamp]').val(profileJson[i].sr);
            frmPopup.find('input[name=pthres]').val(profileJson[i].thres);
            frmPopup.find('input[name=psens]').val(profileJson[i].sens);
            break;
        }
    }
}

/* description: manage profile[edit and delete profiles]
 */
function manageProfile(popupId, editId) {
    var mpTable = $('#profileContent');
    $('.fieldActive').removeClass('fieldActive active');
    
    mpTable.find("tr:gt(0)").remove();
    for (var i = 0; i < profileJson.length; i++) {
        var $tr = $("<tr/>");
        $("<td/>").addClass("tableCelllabel").html(profileJson[i].pname).appendTo($tr);
        $("<td/>").addClass("tableCelllabel").html(profileJson[i].sr).appendTo($tr);
        $("<td/>").addClass("tableCelllabel").html(profileJson[i].sens).appendTo($tr);
        $("<td/>").addClass("tableCelllabel").html(profileJson[i].thres).appendTo($tr);        
        $("<label/>").addClass("lblLink").attr( { "onclick" : "showForm('pFrmEdit', 'edit', '" +profileJson[i].pid+ "')" }).html("edit").appendTo($("<td/>").addClass("tableCelllabel").appendTo($tr));        
        $("<label/>").addClass("lblLink").attr({'pid' :profileJson[i].pid }).click(function () { var $this = $(this); deleteProfileRow($this); }).html("delete").appendTo($("<td/>").addClass("tableCelllabel").appendTo($tr));
        $tr.appendTo(mpTable);
    }
}

/* 
* This function is used to create profile.
*/
function deleteProfileRow(element){
   var ans = confirm("Are you sure you want to delete this profile?");
   if(ans == true ) {       
       $.ajax({
            url: "/Configuration/DeleteProfile",
            type : 'POST',
            cache:false,
            data : { profileId : $(element).attr('pid')},
            success: function (result, textStatus, jqXHR) {
               if(result.status == "True" || result.status == true) {
                    showMessage({ 'msg': 'Profile Deleted Successfully.', 'autoClose': true, 'className': 'success' });
                    $(element).closest('tr').remove();
                    
                    // Get the profiles.
                     getProfiles();
                }
               else {
                    showMessage({ 'msg': result.msg, 'autoClose': true, 'className': 'fail' });
                    
                }
            },
            error : function(err) {
                showMessage({ 'msg': 'Server error occured while deleting profile.', 'autoClose': true, 'className': 'fail' });
            },
            complete: function () {
               //closeMessage();
            }
        });
   }
   else
	  return;
}

//#endregion

//#region zone Related Function ////
/*
* Get the VSIU zone.
*/
function GetVSIUZones(vsiuId) {
    // Getting the site zone data from server.
    $.ajax({
        url: "/Configuration/GetVSIUZones?vsiuId=" + vsiuId,
        global : false,
        cache:false,
        success: function (result, textStatus, jqXHR) {
            zoneJson = result.data;
            fillSiteZone(objSelected.attr('objId'));
        }
    });
}

/*
* This function filter the zone popup for matched elements.
*/
function fillSiteZone(vsiuId) {
    for (var i = 0; i < zoneJson.length; i++) {
        if (vsiuId == zoneJson[i].vsid) {            
            updateFilterBox(zoneJson[i].zones);
            break;
        }
    }
}

/* 
*  zone popup functionality...
*  label popup in sensor panel 
*/
function fieldAction() {
    var zoneHeight = null;
    //var gFListHeight = null;
   // var applyButton = null;
    showField.click(function (e) {
        e.stopPropagation();
        
        var popupId = $(this).find(".fieldDescription").attr('id');
        popupArr = $(this).find(".fieldDescription");
        var allPopup = $(".fieldDescription");
        $.each(allPopup, function () {// if in the hidden class this id is not exist then hide all the hidden popup except this popup whose id is match
            var $this = $(this);
            if ($this.attr('id') != popupId) {
                $this.hide();
            }
        });
        showField.removeClass('fieldActive');
        if (popupArr.is(":visible")) // if box is visible then hide on click on popup-arrow otherwise do viceversa
        {
            popupArr.hide(); //hide the popupbox
            $(this).removeClass('fieldActive'); // remove the click class in it
        }
        else {
            popupArr.show(); //show the popupbox
            $(this).addClass('fieldActive'); // add the click class in it
            //var tval = $(this).find(".searchListBox").val("");
            $(this).find(".searchListBox").focus().val("").trigger('keyup');
            //console.log("click");
        }
        // calculate height of zone popup
        gFListHeight =  fieldContentZone.find(".fList").outerHeight();
        if(gFListHeight == 1){
            applyButton = 0;
            $('#activeZoneName').hide();
        }else{
            fieldContentZone.find(".fFoot").outerHeight();
            $('#activeZoneName').show();
        }
        applyButton = gFListHeight == 1 ? 0 : fieldContentZone.find(".fFoot").outerHeight();
        zoneHeight = fieldContentZone.find(".fHead").outerHeight() + fieldContentZone.find(".fsearch").outerHeight() + gFListHeight + applyButton +10;
        $("#zonePopup").css('height',zoneHeight +'px');

        //checked first radio box
        //$(this).find('input[type="radio"]').eq(0).attr("checked", true);
    });
}

/*
* This method updates the zone on a particular sensor.
*/
function updateSensorZone(zoneId,newZoneName) {
    $.ajax({
        url: "/Configuration/UpdateSensorZone?manufactureId=" + objSelected.attr('manid') + "&zoneId=" + zoneId + "&siteId=" + objSelected.attr('sid'),
        success: function (result, textStatus, jqXHR) {
            if (result.status == "True" || result.status == true) {                
                objSelected.attr('zn', newZoneName);
                $('#sensorZone').text(newZoneName);                
                showMessage({ 'msg': 'Sensor zone updated successfully. Reloading the page...', 'autoClose': true, 'className': 'success' });
                refreshSiteTree();
                //setTimeout("location.reload()",3000);
            }
            else {
                showMessage({ 'msg': result.msg, 'autoClose': true, 'className': 'fail' });
            }
        },
		error: function (result, textStatus, jqXHR) {
			showMessage({ 'msg': 'Server problem occured when updating the sensor zone.', 'autoClose': true, 'className': 'fail' });         
		}
    });
}


/*
* Label searching functionality for sensor panel 
*/
function searchInFilterBox(textToSearch) {
    var matchedArray = [];    
    var arrCounter = 0;
    var zoneHeight = null;
    var gFListHeight = null;
    var applyButton = null;

    for (var i = 0; i < zoneJson.length; i++) {
        for (var j = 0; j < zoneJson[i].zones.length; j++) {
            if (zoneJson[i].zones[j].zname.toLowerCase().indexOf(textToSearch) >= 0 || zoneJson[i].zones[j].za.toLowerCase().indexOf(textToSearch) >= 0 ) {
                matchedArray[arrCounter++] = zoneJson[i].zones[j].zid;
            }
        }
    }

    fieldContentZone.find(" .fListContent").hide();
   
    for (arrCounter = 0; arrCounter < matchedArray.length; arrCounter++) {
        $('#' + matchedArray[arrCounter]).show();
    }
    // first search result in popup is selected
//	if(matchedArray.length >0)
//        $("input[value='" + matchedArray[0] + "']").attr("checked", true);
 // first search result in popup is selected
	if(matchedArray.length >0)
        {
            $("input[value='" + matchedArray[0] + "']").attr("checked", true);
            $('#activeZoneName').show();
        }
        else{
            $('#activeZoneName').hide();
        }

    // new height of profile popup
    gFListHeight = matchedArray.length == 0 ? 0 : fieldContentZone.find(".fList").outerHeight();
    applyButton = matchedArray.length == 0 ? 0 : fieldContentZone.find(".fFoot").outerHeight();
    zoneHeight = fieldContentZone.find(".fHead").outerHeight() + fieldContentZone.find(".fsearch").outerHeight() + gFListHeight + applyButton +10;
    $("#zonePopup").css('height',zoneHeight +'px');
}

/* 
* Runtime store zone name in zone popup according to selected site
*/
function updateFilterBox(zones) {
    
    if (zones.length > 0)
        filterZoneContainer.html('');

    for (var i = 0; i < zones.length; i++) {       
        var $filterZones = $("<div class='fListContent' id='" + zones[i].zid + "'><input type='radio' id='" + zones[i].zname + "' name='rdButton' zname='" + zones[i].zname + "' value='" + zones[i].zid + "'/><label for='" + zones[i].zname + "'>" + (zones[i].za + " ["+zones[i].zname + "]") + "</label></div>");
        $filterZones.appendTo(filterZoneContainer);
    }
   
	//by default first radio button selected
    fieldContentZone.find(".fListContent input[value='" + zones[0].zid+"']").attr("checked", "true");
    
}
//#endregion

/*
* Initialize page actions.
*/
function initializeActions() {
    // Tree view action initializer.
    treeviewClickAction();
}

/*
* initialisation function, contain all functions call
*/
function configurationAction() {
    /*variable initlization*/
    filterPopup = $(".fPopup");
    closeButton = $(".closeArea");
    showField = $(".field");
    editButton = $(".editButton");
    rightsideDiv = $(".rightsideDiv");
    filterZoneContainer = $("#zoneDetails .fieldDescription .fList");
    filterProfilesContainer = $(".profilePopup.fieldDescription .fList");
    fieldDescription = $(".fieldDescription");
    fieldContentZone = $("#zoneDetails .fieldLabel");
    fieldContentProfile = $(".profilePopup .fieldLabel");
    getActiveZoneName = $("#activeZoneName");
    getActiveProfileName = $(".activeProfileName");
    defaultAction()//default action for page
    closeButtonAction(); //by this when click on button then popup are hide
    treeviewClickAction(); //on click of treeview , show desire panel in right side
    fieldAction(); //label popup in sensor panel
    profilePopup(); //show profile popup
   // tabClickAction(); //on click of treeview , show desire panel in right side
    initToolbarButton();
}

/*
* This function will call on clicking the close button of dialog boxes.
*/
function closeButtonAction() { //close function to close poup    
    //Event Handler of the close button click of dialog boxes.
    closeButton.click(function (e) {        
        e.stopPropagation();
        filterPopup.hide();
        showField.removeClass("fieldActive");
    });
  
    // get value of selected group on click apply button
    getActiveZoneName.click(function () {
        var zoneId = fieldContentZone.find(".fListContent input[type='radio']:checked").attr("value");
        var newZoneName = fieldContentZone.find(".fListContent input[type='radio']:checked").attr('zname');
        updateSensorZone(zoneId, newZoneName);
    });

    // get value of selected profile on click APPLY BUTTON of profile popup.
    getActiveProfileName.click(function () {        
        var profileId = fieldContentProfile.find(".fListContent input[type='radio']:checked").attr("value");
        if (typeof (profileId) == 'undefined') {
            jQuery('body').showMessage({ 'thisMessage': ['Kindly select sensor profile first.'], 'className': 'fail', 'displayNavigation': false, autoClose: true });
            $('#showMessage').css('left', parseInt((screen.width / 2) - ($('#showMessage').width() / 2)));
            return false;
        }

        var id;
        // if object clicked in sensor store the id of senosr.
        if(objSelected.attr('rel') == 'sensor')
            id = objSelected.attr('senid');
        else  // Store the ID of element if it is not sensor.
            id= objSelected.attr('objid');

        // Update the sensor profile.
        updateSensorProfile(id, profileId, objSelected.attr('rel'));
    });

    fieldDescription.click(function (e) {
         e.stopPropagation();
    });
 }

/*
* This function is used to get site tree.
*/
function refreshSiteTree() {
     $.ajax({
        url: "/Configuration/SiteTree/",
        success: function (result, textStatus, jqXHR) {
            $('#siteTreeContainer').html(result);
        },
		error: function (result, textStatus, jqXHR) {
			showMessage({ 'msg': 'Error in refreshing the site hierarchy..', 'autoClose': true, 'className': 'fail' });         
		},
		complete: function () {	}
    });
}

/*
*
*/
function defaultAction() {//default action
    filterPopup.hide();

    // Hiding the popup on body click.
    $('body').click(function () {//body click action
        filterPopup.hide();
        showField.removeClass("fieldActive");        
    });
}

/*
*  Update right panel information  	
*  treeViewName : type of the node where click is called.
*  objId : Id of the devision on right panel where information will be shown.
*  Divya moyal.
*/
function updateDetails(treeViewName, objId, tableObj, element) { 
    objSelected = element;

    // check for which element in the tree is clicked.
    if (treeViewName == 'site') {        
        tableObj.find("#siteName").html(element.attr('sname'));
        tableObj.find("#siteVsiu").html(element.attr('vsiu'));
        tableObj.find("#siteCameras").html(element.attr('camera'));
        tableObj.find("#siteZones").html(element.attr('zones'));
        tableObj.find("#siteSensors").html(element.attr('sensor'));
        siteId= element.attr('sid');
        camerasInfo(element.attr('sid'));
    }
    else if (treeViewName == 'vsiu') {       // if the element is VSIU
        tableObj.find("input[name=vname]").val(element.attr('vname'));
        tableObj.find("#vsiuIp").html(element.attr('ip'));
        tableObj.find("#vsiuAlias").html(element.attr('alias'));
        tableObj.find("#vsiuMac").html(element.attr('mac'));
        tableObj.find("#vsiuPort").html(element.attr('port'));
        tableObj.find("#totZone").html(element.attr('zones'));
        tableObj.find("#vsiuSensors").html(element.attr('sensor'));        
    }
    else if (treeViewName == 'zone') {      // if the element is Zone
        // Gettting the zone details from server. objId store the zoneID.
        getZoneDetails(objSelected.attr('objId'));
        tableObj.find("input[name=zoneName]").val(element.attr('zn'));  
        tableObj.find("input[name=nos]").val(element.attr('sen'));  
    }
    else if (treeViewName == 'sensor') {
        var sensorForm = $('#sensorForm');
        
        // Fill the sensor parameter information in the sensor form.      
        sensorForm.find('input[name=siteId]').val(element.attr('sid'));
        sensorForm.find('input[name=vsiuIP]').val(element.attr('ip'));
        sensorForm.find('input[name=vsiuPort]').val(element.attr('port'));        
        sensorForm.find('input[name=shalias]').val(element.attr('shalias'));
        sensorForm.find('input[name=lblshalias]').val(element.attr('shalias'));
        sensorForm.find('input[name=senid]').val(element.attr('senid'));
        sensorForm.find("input[name=manId]").val(element.attr('manid'));

         
        tableObj.find("input[name=sn]").val(element.attr('sn'));       
        tableObj.find("input[name=sens]").val(element.attr('sens'));
        tableObj.find("input[name=samp]").val(element.attr('samp'));
        tableObj.find("input[name=thres]").val(element.attr('thres'));
        tableObj.find("label#sensorZone").text(element.attr('zn'));
        

        // Triggering the details click on right side panel.
        $('.toolbar', 'div.window[rel=' + treeViewName + ']').find('.detail').trigger('click');

        if (element.attr('isalarm') == "True")
            tableObj.find(".sensorStatus:first").attr('src', '/Content/images/on.png');
        else
            tableObj.find(".sensorStatus:first").attr('src', '/Content/images/off.png');
    }
    else {
        showMessage({ 'msg': 'Unknown Object. Please Try Again.', 'autoClose': false, 'className' : 'fail' });       
    }
}
/*
* Get the zone details based on zoneId.
*/
function getZoneDetails(zoneId) {
    $.ajax({
        url: "/Configuration/GetZoneDetails?zoneId=" + zoneId,
        success: function (result, textStatus, jqXHR) {
            // Render the HTML of zone detail.
            $('#segmentDetailsWrapper').html(result);
        },
		error: function (result, textStatus, jqXHR) {
			showMessage({ 'msg': 'Server problem occured when getting the zone details.', 'autoClose': true, 'className': 'fail' });         
		}
    });
}


/* 
* On click of treeview , show desire panel in right side and update value if panel selected.
* Divya Moyal.
*/
function treeviewClickAction() {
    //$("#configure .window[rel='site']").show();
    $('#treeview .treeTab').click(function (e) { 
        e.stopPropagation();
   
        $(".profilePopup").hide();
        showField.removeClass("fieldActive");
        
        if($(this).prop('tagName') == "LI" ) 
        {           
            objSelected = $(this).find('span:first');
        }                        
        else {
            objSelected = $(this);          
        }

        $('#treeview .treeTab').removeClass("activeTreeTab");
        objSelected.addClass("activeTreeTab").attr("visible", "visible");
      
        var target = objSelected.attr("rel");
        var update = objSelected.attr("view");
        var zone = objSelected.attr("zn");
          
        if (objSelected.attr("sid") != siteId) {
            //fillSiteZone($(this).attr("sid"));
            //siteId = $(this).attr("sid");
        }
      
        // site is uniquely identify by update attribute (you can get it from any attribute of tree span)
        updateDetails(target, update, $('table.themeTable', "#configure .window[rel='" + target + "']"), objSelected);
        
        // variable to find current active panel with tree-view functionality
        if (current != target) {
            $("#configure .window").hide().attr("visible", "notVisible");
            $("#configure .window[rel='" + target + "']").show();
        }
        current = target;

        // If VSIU is clicked get the Zones under this VSIU based on VSIU ID that is stored in objId Attribute.
        if (target == 'vsiu') {
           GetVSIUZones(objSelected.attr('objId'));
        }
    });

    $('#treeview .treeTab[rel="site"]:eq(0)').click().addClass("activeTreeTab").attr("visible", "visible");
}

/*
* Get the Camera related information for a particular site.
*/
function camerasInfo(selectedSite) {
    $('.rightUpperLoading').show();

    // Ajax call to get the list of Cameras from database based of passed SiteId.
    $.ajax({
        url: "/Configuration/CamerasInfo?siteId=" + selectedSite,
        success: function (data, textStatus, jqXHR) {
            $('#cameraContent').html(data);
        },
		error: function (result, textStatus, jqXHR) {
			showMessage({ 'msg': 'Server problem occured when getting the camera data.', 'autoClose': true, 'className': 'fail' });         
		}
    });
}

/* 
 * profile searching functionality for sensor panel 
 * divya
 */
function searchInProfileBox(textSearchProfile) {
    var matchedArray = [];
    var arrCounter = 0;
    var profileHeight = null;
    var pFListHeight = null;
    var applyButton = null;

    for (var i = 0; i < profileJson.length; i++) {
        if (profileJson[i].pname.toLowerCase().indexOf(textSearchProfile) >= 0) {
            matchedArray[matchedArray.length] = profileJson[i].pid;
        }
    }
    
    if (matchedArray.length > 0)
        $('.activeProfileName').show();
    else
        $('.activeProfileName').hide();

    fieldContentProfile.find(".fListContent").hide();
    for (arrCounter = 0; arrCounter < matchedArray.length; arrCounter++) {
        $('#' + matchedArray[arrCounter]).show();
    }
    // first search result in popup is selected
    if(matchedArray.length >0)
        $("input[value='" + matchedArray[0] + "']").attr("checked", true);

    // new height of profile popup
    pFListHeight = matchedArray.length == 0 ? 0 : fieldContentProfile.find(".fList").outerHeight();
    applyButton = matchedArray.length == 0 ? 0 : fieldContentProfile.find(".fFoot").outerHeight();
    profileHeight = fieldContentProfile.find(".fHead").outerHeight() + fieldContentProfile.find(".fsearch").outerHeight() + pFListHeight + applyButton + fieldContentProfile.find(".footCreate").outerHeight() + fieldContentProfile.find(".footManage").outerHeight() +18;
    $(".profilePopup").css('height',profileHeight +'px');
   
}

/* 
 *  Runtime store profile name in profile popup according to selected site.
 *  By divya.
 */
function updateProfileBox(profiles) {        
    if (profiles.length > 0)
        filterProfilesContainer.html('');
            
    for (var i = 0; i < profiles.length; i++) {
        var $filterProfiles = $("<div class='fListContent' id='" + profiles[i].pid + "'><input type='radio' id='" + profiles[i].pname + "' name='rdButton' pname='" + profiles[i].pname + "' value='" + profiles[i].pid + "'/><label for='" + profiles[i].pname + "'>" + profiles[i].pname + "</label><label ' editId='" + profiles[i].pid + "' class=\"editProfile\" onclick=\"showForm('pFrmEdit', 'edit', '" + profiles[i].pid + "')\">edit</label></div>");
        $filterProfiles.appendTo(filterProfilesContainer);
    }
    
    editOnHover(); // show edit link on hover
    profileClickAction(); // show tooltip on hover
}

/*
* This function open the form to update the sensor details.
*/
function editSensor(element) {
   /* $(element).parent().parent().find('.toolbarButtonSelected').removeClass('toolbarButtonSelected');
    $(element).parent().addClass('toolbarButtonSelected');
    $('div[rel=sensor]', 'div#configure').find('.updateParam').removeAttr('disabled').removeAttr('readonly').removeClass('txtLabel').eq(0).focus();
    $('div[rel=sensor]', 'div#configure').find('.controlbar:first').show();*/
}

/*
* Edit button click on sensor form.
*/
function editSensorForm() {
    $('div[rel=sensor]', 'div#configure').find('.updateParam').removeAttr('disabled').removeAttr('readonly').removeClass('txtLabel').eq(0).focus();
    $('div[rel=sensor]', 'div#configure').find('.controlbar:first').show();
    /*Bidhu 21.09.2012*/
    removeRollover = true;

    $('div[rel=sensor]', 'div#configure').find('.updateParam').removeAttr('disabled').removeAttr('readonly').addClass('addpadding');
    $("div.editbox").hide();
    /*Bidhu*/
}

/*
* Initializes the toolbar buttons action.
* divya moyal.
*/
function initToolbarButton() {
    $('.toolbarButton.detail, .toolbarButton.edit, .toolbarButton.update,.toolbarButton.cancel').click(function () {
        var element = $(this);
        var toolbar = element.parent().parent();
        var rel = element.parents().eq(2).attr('rel');
        toolbar.find('.toolbarButtonSelected').removeClass('toolbarButtonSelected');
        element.addClass('toolbarButtonSelected');
        toolbar.find(".rightsideDiv").hide();

        // If detail is clicked.
        if ($(this).hasClass('detail')) {
            toolbar.parent().find('.updateParam').attr('disabled', 'disabled').attr('readonly', 'readonly').addClass('txtLabel');
            /*Bidhu 21.09.2012*/
            toolbar.parent().find('.updateParam').attr('disabled', 'disabled').attr('readonly', 'readonly').removeClass('addpadding');
            removeRollover = false;
            if(storeOldValue != null) {
                   $("#"+getglobalid+" input.txtLabel").attr("value",storeOldValue);
             }
             $("a.inlineEdit").show();
             $("a.inlineUpdate").hide();
             $("a.inlineCancel").hide();
            
            newEvents();
            /*Bidhu*/
        }
        else if ($(this).hasClass('edit')) // If edit is clicked.
        {
            toolbar.find(".rightsideDiv").show();
            // If button belongs to sensor.
            if (rel == 'sensor') {
                $('#sensorForm').find('input[name=manId]').val(objSelected.attr('manid'));   
                editSensorForm();            
            }
            toolbar.parent().find('.updateParam').removeAttr('disabled').removeAttr('readonly').removeClass('txtLabel').eq(0).focus();
        }
        else if ($(this).hasClass('update')) { // If update is clicked.
            
            rel = element.parents().eq(3).attr('rel');

            // If button belongs to sensor.
            if (rel == 'sensor') {
                updateSensorDetails();
            }

            $('div[rel=' + rel + ']', 'div#configure').find('.updateParam').attr('disabled', 'disabled').attr('readonly', 'readonly').addClass('txtLabel');
            toolbar.removeClass('toolbarButtonSelected').find(".detail:first").addClass('toolbarButtonSelected');
        }
        else if ($(this).hasClass('cancel')) {  // If cancel is clicked.
            objSelected.click();
            
            rel = element.parents().eq(3).attr('rel');
            $('div[rel=' + rel + ']', 'div#configure').find('.updateParam').attr('disabled', 'disabled').attr('readonly', 'readonly').addClass('txtLabel');
            toolbar.removeClass('toolbarButtonSelected').find(".detail:first").addClass('toolbarButtonSelected');
        }
    });
}

/*
* This function update the sensor information.
*/
function updateSensorDetails() {
    var form = $('#sensorForm');
    hideblocker();

    // Getting the site group data from server.
    $.ajax({
        url: "/Configuration/UpdateSensor",
        type: 'POST',
        data: form.serialize(),
        success: function (result, textStatus, jqXHR) {
            if (result.status == true || result.status == "True") {                
                objSelected.attr('shalias', form.find('input[name=hwAlias]').val());
                objSelected.attr('sens', form.find('input[name=sensorValue]').val());
                objSelected.attr('samp', form.find('input[name=samp]').val());
                objSelected.attr('thres', form.find('input[name=thresValue]').val());
                
                showMessage({ 'msg': 'Sensor parameters updated successfully. Reloading the page...', 'autoClose': true, 'className': 'success' });
                setTimeout("location.reload()",3000);
            }
            else {
                objSelected.click();
                showMessage({ 'msg': 'Some server problem occured when updating the sensor parameters.', 'autoClose': true, 'className': 'fail' });
            }            
        },
        error : function(err) {
            objSelected.click();
            showMessage({ 'msg': 'Some server problem occured when updating the sensor parameters.', 'autoClose': true, 'className': 'fail' });
        },
        complete: function(result) {
            hideblocker();
        }
    });
}

//-----------------------------------------------------------
/* configuration page profile details update functions[show form, dreate new, update, manage, edit, delete, create, apply]
 * created by Divya Moyal [11-july-12]
 */
//-------------------------------//Start//-------------------------------//

/*  Description: show profile form popup
*  Parameter: popupId= form popup id witch will show, type= type of form to diffrenciate[edit, create, manage], editId= unique value of edit button for compare similar profile and edit link
*/
function showForm(popupId, type, editId) {  
    var sens;
    var thres;
    var samp;
    var editId;
    var disablePage = $('#loadingbg');
    var frmPopup = $("#" + popupId);

    if (type == 'edit') {        
        editProfile(editId, frmPopup);
        showFormPopup(popupId);
    }
    else if (type == 'create') {
        frmPopup.find('input[type="text"]').val("");
        showFormPopup(popupId);
    }
    else if (type == 'manage') {
        manageProfile(frmPopup, editId);        
        showFormPopup(popupId);
        editByManage = true;
    }
    else if (type == 'updateBtn') {
        updateProfile();
        hideForm(popupId);
    }
    else if (type == 'createBtn') {
        //console.log(profileJson);
        createNew();
        hideForm(popupId);
       // console.log(profileJson);
    }
    else if (type == 'okBtn') {
        applyChange();
        hideForm(popupId);
    }
    $(popupId).find('input[type=text]:first').focus();
}

/* 
*  Description: hide profile form popup
*  Parameter: popupId= form popup id witch will hide
*/
function hideForm(popupId) {
    var frmPopup = $("#" + popupId);
    var disablePage = $('#loadingbg');        
    
    //if(editByManage == false && popupId != 'pFrmEdit') { 
    //}
    frmPopup.hide();
    disablePage.hide();
}

/* description: ok buttn click function apply manage profile changes
*/
function applyChange() {
    if(typeof (console) != 'undefined');
        console.log("ajax call for ok click");
        //updateProfileBox(profiles);
}

/*-------------------------//END//----------------------*/

// bidhu
var storeOldValue = null;
var collectallids = [];
var collectupdateclickedornotarray = [];
var storeOldValueArray = [];


/*Show Blocker*/
function showblocker(){
   var blockerobj = document.getElementById("blocker");
        blockerobj.style.display = "block";
}
/*Show Blocker*/

/*Hide Blocker*/
function hideblocker(){
   var blockerobj = document.getElementById("blocker");
        blockerobj.style.display = "none";
}

/*
* coded by bidhu.
*/
function makeEditable(obj) {
    var getid = $(obj).parent().parent().parent().attr("id");
    findAllIdsEdit(getid);
    storeOldValue = $("#"+getid+" input.txtLabel").attr("value");
    $("#"+getid+" input.txtLabel").removeAttr('disabled').removeAttr('readonly').eq(0).focus();
    $("#"+getid+" input.txtLabel").removeClass('txtLabel');
    $("#"+getid+" input").addClass('addpadding');
    
    if(removeRollover == false)
    {
        showEvents(getid);
    }
    else
    {
        hideEvents(getid);
    }
    $(obj).hide();
    $("a.inlineUpdate").show();
    $("a.inlineCancel").show();

     for(var i=0;i<collectupdateclickedornotarray.length;i++)
    {
        if(collectupdateclickedornotarray[i][1] != 1 && collectupdateclickedornotarray[i][2] == 0 && collectupdateclickedornotarray[i][3] == 0) {            
            hideEvents(collectupdateclickedornotarray[i][0]);
        }
    }
    getglobalid = getid;   
}

/*
*  Update the single sensor Parameter.
*  [ Parameter value can be Sensor sensitivity, sensor threshold, sensor sampling rate ].
* divya
*/
function updatetextfld(obj) {    
    var getid = $(obj).parent().parent().parent().attr("id");
    findAllIdsUpdate(getid);
    var selectedId = getid;
    var value = $("#"+getid+" input[type=text]:first").attr("value");

    if(isNaN(value) || $.trim(value) == ""){
        showMessage({ 'msg': 'Please enter valid parameter values.', 'autoClose': false, 'className': 'fail' });
        return false;
    }

    $("#"+getid+" input[type=text]:first").removeClass('addpadding');
    $("a.inlineUpdate").hide();
    $("a.inlineCancel").hide();
    $("a.inlineEdit").show();
    newEvents();
    var url;
    
    // check for which element update is called. 
    switch(getid) {  
        case ('sampling_rate'):
         url = "/Configuration/SetSensorSampling/";
         if(value < 0 || value > 6) {
           showMessage({ 'msg': 'Invalid sampling value. Sampling value can between 0 to 6', 'autoClose': true, 'className': 'fail' });           
           cancelUpdate(obj);
           setTimeout("closeMessage()",3000);
		   return;
        }
        break;

        case ('sens_level'):
          url = "/Configuration/SetSensorSensitivity/";
         if(value < 0 || value > 3) {
           showMessage({ 'msg': 'Invalid sensitivity value. Sensitivity value can between 0 to 3', 'autoClose': true, 'className': 'fail', delayTime: 3000 });
           cancelUpdate(obj);
           setTimeout("closeMessage()",3000);
		   return;
          }
        break;

        case ('threshold_value'):
        url = "/Configuration/SetSensorThresold/";
         if(value < 0 || value > 100) {
           showMessage({ 'msg': 'Invalid threshold value. Threshold value can between 0 to 100', 'autoClose': true, 'className': 'fail', delayTime: 3000 });
           cancelUpdate(obj);
           setTimeout("closeMessage()",3000);
		   return;
          }
        break;

        case ('sens_alias'):
        url = "/Configuration/ChangeHardwareAlias/";
        break;
    }

    /*
    if(getid == 'sens_alias') {        
        var isVSNExist = CheckVSNAlias($('input#shalias','#sensorForm').val(),objSelected.attr('ip'));
        var ans = confirm("Are you sure you want to update the sensor alias?");

        if(isVSNExist == true && ans == true) {
            showMessage({ 'msg': 'Sensor alias already registered with another sensor.', 'autoClose': true, 'className': 'fail' });
            return false;
        } else {
            $("#"+getid+" input[type=text]:first").removeClass('addpadding');
            $("#"+getid+" input.txtLabel").attr('disabled','disabled').attr('readonly');
            $("#"+getid+" input.txtLabel").addClass('txtLabel');
            $("#"+getid+" input").removeClass('addpadding');
        }
    }*/

   //var ans = confirm("Are you sure you want to update the sensor alias?");
   //var isVSNExist = CheckVSNAlias($('input#shalias','#sensorForm').val(),objSelected.attr('ip'));
   //if(ans == true && !isVSNExist) {
        // check for the duplicacy of sensor aliases.
        
        
        var form = $('#sensorForm');
        $('input[disabled=disabled]',form).removeAttr('disabled');
        
        showblocker();
        $.ajax({
            url: url,
            type : 'POST',
            cache : false,
            data : form.serialize(),
            success: function (result, textStatus, jqXHR) {
               if(result.status == false) {
                    //showMessage({ 'msg': result.msg, 'autoClose': true, 'className': 'fail' });
                    showMessage({ 'msg': 'Some server problem occured when updating the sensor parameters.', 'autoClose': true, 'className': 'fail' });         
                    $("#"+getid+" input").val(storeOldValue);
               }
               else {
                    showMessage({ 'msg': 'Parameter updated successfully. Reloading the page...', 'autoClose': true, 'className': 'success' });
                    setTimeout("location.reload()",3000);
               }        
            },
            error: function(err) {
            objSelected.click();
            showMessage({ 'msg': 'Some server problem occured when updating the sensor parameters.', 'autoClose': true, 'className': 'fail' });
             },
            complete: function(result) {  
                $("#"+getid+" input").addClass('txtLabel');  
                $('input[type=text]',form).attr('disabled','disabled');     
                hideblocker();     
            }
        });
//    } else {

//    }
}

/*
* check if the same VSN alias already exist.
*/
function CheckVSNAlias(alias,vsiuIP) {
     $.ajax({
            url: "/Configuration/CheckVSNAlias/",
            type : 'GET',
            data : { 'alias' : alias,'vsiuIP' : vsiuIP },
            cache : false,       
            async : false,
            success: function (result, textStatus, jqXHR) {
               return result;             
            },
            error: function(err) {
                return false;
            }
        });
}

/*
* coded by bidhu.
*/
function cancelUpdate(obj) {
   var getid = $(obj).parent().parent().parent().attr("id");
   findAllIdsCancel(getid);    
    $("a.inlineUpdate").hide();
    $("a.inlineCancel").hide();
    $("a.inlineEdit").show();
   

   $("#"+getid+" input.txtLabel").attr('disabled','disabled');   
   $("#"+getid+" input").addClass('txtLabel');
   $("#"+getid+" input").removeClass('addpadding');
   if(storeOldValue != null) {
        $("#"+getid+" input.txtLabel").attr("value",storeOldValue);
   }

  // coded by bidhu
  newEvents();
}

function showEditBox(obj) {
    $("#"+obj.id+" div.editbox").show();
     
}

function hideitbox(obj) {
    $("#"+obj.id+" div.editbox").hide();
}

/*
* coded by bidhu.
*/
function newEvents() {
    $("td.txtLabel_edatable").bind({
        "mouseenter":function(){
            if(removeRollover == false)
            {
                showEditBox(this);
            }
        },
        "mouseleave":function(){
            if(removeRollover == false)
            {
                hideitbox(this);
            }
        }
    });    
}

/*
* coded by bidhu.
*/
function hideEvents(obj) {    
    $("td#"+obj).bind({
        "mouseenter":function(){
            if(removeRollover == false)
            {
                hideitbox(this);
            }
        },
        "mouseleave":function(){
            if(removeRollover == false)
            {
                hideitbox(this);
            }
        }
    });    
}

/*
* coded by bidhu.
*/
function showEvents(obj) {    
    $("td#"+obj).bind({
        "mouseenter":function(){
            if(removeRollover == false)
            {
                showEditBox(this);
            }
        },
        "mouseleave":function(){
            if(removeRollover == false)
            {
                showEditBox(this);
            }
        }
    });    
}

/*
* coded by bidhu.
*/
function findAllIdsEdit(obj){
    collectallids = $("table.themeTable").find("td.txtLabel_edatable");
    for(var i=0;i<collectallids.length;i++)
    {
        collectupdateclickedornotarray[i] = [$(collectallids[i]).attr("id"),0,0,0,0];
        collectupdateclickedornotarray[i][1] = 0;
         
        if(obj == collectupdateclickedornotarray[i][0])
        {
            collectupdateclickedornotarray[i][1] = 1;
           collectupdateclickedornotarray[i][4] = $("#"+collectupdateclickedornotarray[i][0]+" input.txtLabel").attr("value");
        }
    }    
}

/*
* coded by bidhu.
*/
function findAllIdsUpdate(obj){
    collectallids = $("table.themeTable").find("td.txtLabel_edatable");
    for(var i=0;i<collectallids.length;i++)
    {
       //collectupdateclickedornotarray[i] = [$(collectallids[i]).attr("id"),0,0,0];
        collectupdateclickedornotarray[i][2] = 0;
        if(obj == collectupdateclickedornotarray[i][0])
        {
            
            collectupdateclickedornotarray[i][2] = 1;
        }
    }    
}

/*
* coded by bidhu.
*/
function findAllIdsCancel(obj){
    collectallids = $("table.themeTable").find("td.txtLabel_edatable");
    for(var i=0;i<collectallids.length;i++)
    {
        //collectupdateclickedornotarray[i] = [$(collectallids[i]).attr("id"),0,0,0];
        collectupdateclickedornotarray[i][3] = 0;
        if(obj == collectupdateclickedornotarray[i][0])
        {
            
            collectupdateclickedornotarray[i][3] = 1;
        }
    }    
}
