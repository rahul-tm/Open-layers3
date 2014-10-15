/*---------------------------------------------------------------\
+
+ Project     : Perimeter Intrusion Detection System
+ Filename    : map_index.js
+ Module Name : Script for Three Screen Map Page(Used to show current alarm.
+ Purpose     : The map view index page js file.
+ Coded By    : Deepak Arora
+ Date        : Jun 11, 2012 19:43:33 2010 -0500
+  
+---------------------------------------------------------------*/

//#region ///   Variable Declaration.   ///

var counter = 0;
var rangeOption = null;
var selectedSiteName = (window.opener) ? window.opener.selectedSiteName : 'BaseCamp';
var notificationDays = -10;
var ActiveAlarmLimit = -1;
var AlarmHistoryLimit = 50;
var hideSidebar = null; //variable for hide sidebar in map page
var showSidebar = null; //variable for show sidebar in map page
var siderBar = null; //variable for sidebar in map page
var hideAlarmbar = null; //variable for hide AlarmBar in map page
var showAlarmbar = null; //variable for show AlarmBar in map page
var AlarmBar = null; //variable for AlarmBar . map page
var showControl = null; //variable for show control on map page
var showControlPopup = null; //variable for show control popup on map pagemap
var mapNotification = null; // statusbar buttons click
var oldRel = null;
var ackRow = null;
var showLog = 0;   // bit to set whether to show debug log in console or not.
var activeXHR = null;
var historyXHR = null;
var poolingOn = false;

//#endregion

//#region ///   Page Load Event   ///
// Load after window loads.
$(window).load(function () {
    // If there is any message. showing hide it.
    closeMessage();

    // bind body click to hide the show control popup.
    $('body').click(function () {//body click action        
        if (showControl.hasClass('selected')) {
            showControl.removeClass('selected');
            showControlPopup.animate({ height: "hide" }, 400);
        }
    });

    // Map Device Show / Hide Panel Event Registering. show device panel
    $("table.alarmTable tr td input:checkbox").click(function () {

        //var chk = $(this).find('input:checkbox');       
        var chk = $(this);
        // toggle the checkbox
        //chk.attr('checked', !chk.attr('checked'));
		
		if(chk.attr('checked') == true){
		chk.attr('checked') = false;
		}
		else if(chk.attr('checked') == false){
		chk.attr('checked') = true;
		}
		
		//console.log(chk.attr('checked'));
        // Select the sensor on the map.
        mapDeviceSelect(chk, chk.attr('dtype')); 
		
    });
	
	
	
});

//#endregion

/*
* Calling the basic function to intialize map.
*/
function initMap() {
    // Getting the alarm notifications.[Acknowledged and unacknoqledged alarms].
    getActiveAlarms();

    // Get the overrided alarms
    OverridedAlarm();
}

// When Site is change from dashboard this function will update the map page.
function updateMapForSite(siteId) {
    selectedSite = siteId;
    showControlPopup.find(':checkbox').attr('checked', 'checked');
    initMap();
    loadSiteMapOnPage(siteId);
}

// Getting the site data[Zones, Sensor Lines, Sensors, cameras, Points].
function mapAction() {
    // { --- variable initlization --- }
    showControl = $(".showControlers"); //variable for show control on map page
    showControlPopup = $(".optionMap"); //variable for show control popup on map page
    //hideSidebar = $("div.hideSidebar"); //variable for hide sidebar in map page
    //showSidebar = $("div.showSidebar"); //variable for show sidebar in map page
    siderBar = $("div.sidebarPopup"); //variable for sidebar in map page    
    hideAlarmbar = $(".hide"); //variable for hide AlarmBar in map page
    showAlarmbar = $("div.showAlarm"); //variable for show AlarmBar in map page
    AlarmBar = $("div.alarmPopup"); //variable for AlarmBar in map page 
    alarmpopup = $("div#alarmOpen"); //variable for Alarmpopup in map page
    historypopup = $("div#historyOpen"); //variable for historypopup in map page
    mapNotification = $("div.showAlarm ");

    //sidebarAction();
    bottomPopupAction();
    //toolbarTabs();
    showControlsPopup();
    rowClickAction();  //row click action in alarm popup
    showControlPopup.find(':checkbox').attr('checked', 'checked');
}

/*function load alarm popup on click notification icon and hide on click arrow sign in alarm popup*/

/*
* Initialize the bottom panel(alam panel, show hide JS).
*/
function bottomPopupAction() {
    mapNotification.toggle(function (event) {
        event.preventDefault();
        var targetRel = $(this).attr("rel");
        if (oldRel != targetRel) {

            $(".showAlarm[rel='" + oldRel + "']").click();
            $(".alarmPopup[rel='" + targetRel + "']").animate({ height: '250px' }, 300);

            noti_show = 0;
            noti_unread = 0;

            notificationReset();

            oldRel = targetRel;

            if (targetRel == "mapAlarm")
                $('#activepaging').show();
            else
                $('#overridepaging').show();
        }
    }, function (event) {
        event.preventDefault();
        var targetRel = $(this).attr("rel");
        $(".alarmPopup[rel='" + targetRel + "']").animate({ height: '0px' }, 300);

        noti_show = 1;
        noti_unread = 0;

        oldRel = null;
        // $('#activepaging').hide();
        // $('#overridepaging').hide();
    });
    //$(".showAlarm[targetRel='mapAlarm']").click();
    hideAlarmbar.click(function () {
        $(".showAlarm[rel='" + oldRel + "']").click();
        //$('#activepaging').hide();
        // $('#overridepaging').hide();
    });
}

/*
* Popup open on click  show button in header
*/
function showControlsPopup() {
    showControl.click(function (e) {
        e.stopPropagation();
        if (!showControl.hasClass('selected')) {
            showControl.addClass('selected');
            showControlPopup.animate({ height: "show" }, 400);
        }
        else {
            showControl.removeClass('selected');
            showControlPopup.animate({ height: "hide" }, 400);
        }
    });

    showControlPopup.click(function (e) {
        e.stopPropagation();
    });
}

/*
* Get Overrided Alarms
*/
function OverridedAlarm() {
    showMessage({ 'msg': 'Loading...', 'autoClose': false, 'className': 'success' });

    if (historyXHR != null)
        historyXHR.abort();

    historyXHR = $.ajax({
        type: "GET",
        url: ("/Map/OverridedAlarm/"),
        cache : false,
        data: ({ siteId: selectedSite, limit: -1}),
        success: function (msg) {
            $('#ackWrapper').html(msg);
        },
        complete: function (msg) {
            closeMessage();
        }
    });
}

/*
* When Change site it will call.
*/
function changeSiteName(element) {
    var branchid = element.value;
    if (branchid !== "") {
        getSiteData();
        getActiveAlarms();
        OverridedAlarm();
    }
}

/*
*
*/
function ChangeAlarmType() {
    var value = $("#ActualAlarm option:selected").text();
    $('tr.controlButtons').hide();
    $('tr[id="' + value + '"]').show();
}

/*
* Calling the function of video panel that Turn On the camera for Live Feed.
*/
function cameraLiveFeed(camname) {
    if (window.opener) {
        window.opener.getLiveFeed(camname);
    }
}

/*
* Add New alarms in the alarm table.
*/
function addNewAlarms(jsonData) {
    var tempDate;
    var start_date;
    var start_time;
    var cease_time;
    var cease_time_full;
    var day;
    var hours;
    var minutes;
    var seconds;
    var newAlarmRows = "";

    if (noti_show) {
        noti_unread += jsonData.length;
        notificationAlert(noti_unread);
    }

    if ($('.active-alarm-row', '#AlarmTable').length == 0)
        $('#noActiveAlarm', '#AlarmTable').remove();

    $.each(jsonData, function (i, dt) {
        // If checkall is selected uncheck that.    
        $('input[type=checkbox].checkall:first', '#unAckWrapper').removeAttr('checked');

        cease_time_full = "";
        tempDate = new Date(parseInt(dt.st.slice(6, -2)));
        day = (parseInt(tempDate.getDate()) < 10) ? "0" + tempDate.getDate() : tempDate.getDate();
        start_date = day + "-" + mon_name[tempDate.getMonth()] + "-" + tempDate.getFullYear();

        hours = (parseInt(tempDate.getHours()) < 10) ? "0" + tempDate.getHours() : tempDate.getHours();
        minutes = (parseInt(tempDate.getMinutes()) < 10) ? "0" + tempDate.getMinutes() : tempDate.getMinutes();
        seconds = (parseInt(tempDate.getSeconds()) < 10) ? "0" + tempDate.getSeconds() : tempDate.getSeconds();
        start_time = hours + ":" + minutes + ":" + seconds;

        if (dt.OverrideTime != null && parseInt(dt.OverrideTime.slice(6, -2)) > 0) {
            tempDate = new Date(parseInt(dt.OverrideTime.slice(6, -2)));
            day = (parseInt(tempDate.getDate()) < 10) ? "0" + tempDate.getDate() : tempDate.getDate();

            hours = (tempDate.getHours() < 10) ? "0" + tempDate.getHours() : tempDate.getHours();
            minutes = (tempDate.getMinutes() < 10) ? "0" + tempDate.getMinutes() : tempDate.getMinutes();
            seconds = (tempDate.getSeconds() < 10) ? "0" + tempDate.getSeconds() : tempDate.getSeconds();
            cease_time = hours + ":" + minutes + ":" + seconds;

            cease_time_full = day + "-" + mon_name[tempDate.getMonth()] + "-" + tempDate.getFullYear() + " " + cease_time;
        }
        else {
            cease_time = "-";
        }

        var row = $('#alarmRowBlank div:first').clone();

        row.attr({ 'a-sid': dt.sId, 'a-logid': dt.id, 'a-salias': dt.sa, 'a-sha': dt.sha, 'a-stime': start_time, 'a-sdate': start_date, 'a-type': dt.name, 'a-sid': dt.sId, 'ptz': dt.ptz, 'pr': dt.pr, 'sev': dt.sev, 'cam': dt.cam });
        row.find('label.a-type:first').text(dt.name);
        row.find('label.a-sdate:first').text(start_date);
        row.find('label.a-stime:first').text(start_time);
        row.find('label.a-zname:first').text(dt.zn);
        row.find('label.a-lblSA:first').text(dt.sa);
        row.find('label.a-lblSHA:first').text(dt.sha);       
        row.find('label.a-cam:first').text( (dt.cam != null) ? dt.cam : "-");

        // Adding new alarms in table.
        $(row).prependTo('#AlarmTable', '#unAckWrapper');

        sensor_alert_status.push({ sId: dt.sId, img: 'sensor1.png', IsAlarm: 1 });

        if (i == jsonData.length - 1) {
            alarm_panel_max_time = start_date + " " + start_time;
        }

        // Binding events on Alarm Row click and checkbox change.
       // rowClickAction(row);
        alarmCheckBoxClickAction(row.find(':checkbox.check:first'));
    });

    // increase the serial no by one.
    $('label.a-sno', '#AlarmTable').each(function (i, dt) {
        $(this).text(i + 1);
    });

    $('.overSpeedingAlarm', '#AlarmTable').removeClass('overSpeedingAlarm');
    //$('.active-alarm-row:first', '#AlarmTable').addClass('overSpeedingAlarm');

    var lastAlarm = $('.active-alarm-row:last', '#AlarmTable');
    alarm_panel_min_time = lastAlarm.attr('a-sdate') + " " + lastAlarm.attr('a-stime');
}

function updateExistingAlarms(jsonData) {
    
    var cease_time = null;
    var tempDate;
    var start_date;
    var start_time;
    var hours;
    var minutes;
    var seconds;
    var overrideBit = false;

    $(jsonData).each(function (i, dt) {
        if (dt.isOver == true) {
            tempDate = new Date(parseInt(dt.ct.slice(6, -2), 10));

            hours = tempDate.getHours();
            minutes = tempDate.getMinutes();
            seconds = tempDate.getSeconds();

            if (hours < 10) { hours = "0" + tempDate.getHours(); }
            if (minutes < 10) { minutes = "0" + parseInt(tempDate.getMinutes(), 10); }
            if (seconds < 10) { seconds = "0" + tempDate.getSeconds(); }
            cease_time = hours + ":" + minutes + ":" + seconds;
        }
        else {
            cease_time = "-";
        }

        $('.active-alarm-row', '#AlarmTable').each(function (j, row) {
            var current_row = $(this);

            if (current_row.attr('a-logid') == dt.id) {
                // Updating the alarm type.
                current_row.find('label.a-type').text(dt.name);

                if (dt.isOver == true) {
                    overrideBit = true;
                    current_row.remove();

                    // increase the serial no by one.
                    $('label.a-sno', '#AlarmTable').each(function (i, dt) {
                        $(this).text(i + 1);
                    });

                    // Updating the cease time.
                    //current_row.removeClass('overSpeedingAlarm geofenceViolationAlarm ').addClass('fuelAlarm').attr('a-ctime', cease_time).find('label.a-ctime').text(cease_time);
                    //current_row.find('img.ackImg').attr({ "title": 'Acknowledge alarm', "onclick": "javascript:acknoledgeAlarm('single',this,event);", 'src': '/content/images/bell.png' });

                    //current_row.find('.contentpart:eq(0), .contentpart:eq(1)').show();
                    //$('#OvrAlarmTable').prepend(current_row);
                    //OverridedAlarm();
                  
                }
                // Breaking out jquery each loop.                
                return (false);
            }
        });


        var found = false;
        for (var k = 0; k < sensor_alert_status.length; k++) {
            if (sensor_alert_status[k].sId == dt.sId) {
                if (sensor_alert_status[k].IsAlarm == 0 && dt.isOver == false) {
                    sensor_alert_status[k].IsAlarm = 1;
                }

                found = true;
                break;
            }
        }

        if (found == false) {
            sensor_alert_status.push({ sId: dt.sId, img: 'sensor1.png', IsAlarm: (dt.isOver == true) ? 0 : 1 });
        }
    });

    // If any existing alarm gets overrided.
    if (overrideBit)
        OverridedAlarm();

    if ($('.active-alarm-row', '#AlarmTable').size() <= 0)
        $('#noActiveAlarm').css('display', 'block');

    if (sensor_alert_status.length > 0) {
        myMap.sensoralert(sensor_alert_status);
    }
}

/*
* Returns the existing log ids present in alarm table
*/
function getExistingLogIds() {
    var logIds = "";
    $('#AlarmTable tbody tr').each(function () {
        if ($(this).attr('a-ctime') == "-") {
            if (logIds !== "")
                logIds += ",";

            logIds += $(this).attr('a-logid');
        }
    });

    return logIds;
}

// Get alarm notifications.
function getActiveAlarms() {

    refreshMap();   //we need to refresh the map when DB in Empty OR VSIU Stops in 3-Page View (pankaj)
    //alert("get active alarms") //pankaj
    showMessage({ 'msg': 'Loading...', 'autoClose': false, 'className': 'success' });

    if (activeXHR != null)
        activeXHR.abort();

    activeXHR = $.ajax({
        type: "GET",
        url: ("/Map/GetActiveAlarms/"),
        cache: false,
        data: ({ siteId: selectedSite, limit: ActiveAlarmLimit }),
        success: function (msg) {
            $('#unAckWrapper').html(msg); //console.log(msg); //pankaj
        },
        complete: function () {
            closeMessage();
            $('#alarmLoading').hide();

            if (!poolingOn) {
                $.getScript("/Comet/LongPolling.js", function () {
                    
                    initLongPolling();
                    poolingOn = true;
                });
            }
        }
    }); 
}


// Get active alarms while clicking on the Active Alarm panel. 
function getActiveAlarmsPanel() {

    //refreshMap();   //we need to refresh the map when DB in Empty OR VSIU Stops in 3-Page View (pankaj)
    //alert("get active alarms") //pankaj
    showMessage({ 'msg': 'Loading...', 'autoClose': false, 'className': 'success' });

    if (activeXHR != null)
        activeXHR.abort();

    activeXHR = $.ajax({
        type: "GET",
        url: ("/Map/GetActiveAlarms/"),
        cache: false,
        data: ({ siteId: selectedSite, limit: ActiveAlarmLimit }),
        success: function (msg) {
            $('#unAckWrapper').html(msg); //console.log(msg); //pankaj
        },
        complete: function () {
            closeMessage();
            $('#alarmLoading').hide();

            if (!poolingOn) {
                $.getScript("/Comet/LongPolling.js", function () {
                    
                    initLongPolling();
                    poolingOn = true;
                });
            }
        }
    }); 
}


/*
* This function refresh the map.(pankaj) Needs to be refreshed when active alarms popup opens on 3 page view.
*/
function refreshMap() {
    //alert("map refreshed"); //pankaj
    loadSiteMapOnPage(selectedSite); 
    $('.openPopup, #mapContainer').find(':checkbox').attr('checked', 'checked');
}

// For Acknowledge alarm.
function acknoledgeAlarm(mode, obj, event) {
    event.stopPropagation();  
    var ackRow;
    var logIds = "";
    var sensorAlias = "";
    var alarmType = "";
    
    // If single alarm acknoledged is clicked.
    if (mode == "single") {
        ackRow = $(obj).parent().parent().parent();

        /*
        if (ackRow.attr('a-ctime') == "-" || ackRow.attr('a-ctime') == "") {
            jQuery('body').showMessage({ 'thisMessage': ['Could not acknowledge active alarm.'], 'className': 'fail', 'displayNavigation': false, autoClose: true });
            $('#showMessage').css('left', parseInt((screen.width / 2) - ($('#showMessage').width() / 2)));
            return false;
        }*/
        
        logIds = ackRow.attr('a-logid');
        sensorAlias = ackRow.attr('a-salias');
        $('#lblST').text(ackRow.attr('a-sdate') + " " + ackRow.attr('a-stime'));
        $('#lblHWAlias').text(ackRow.attr('a-shalias'));
        $('#lblZName').text(ackRow.attr('a-zn'));

        alarmType = $(ackRow).attr('a-type');
        
    }
    else // If multiple alarm acknowledge is clicked.
    {
        // Getting all the checked rows.
        ackRow = $('.check:checked', '#ackAlarmTable').parent().parent();

        if (ackRow.length <= 0) {
            showMessage({ 'msg': 'Kindly select at least one alarm to acknowledge.', 'autoClose': true, 'className': 'fail' });
            return false;
        }

        ackRow.each(function (i, dt) {
            if (logIds !== "")
                logIds += ",";

            if (sensorAlias !== "")
                sensorAlias += ",";

            if (alarmType !== "")
                alarmType += ",";

            logIds += $(this).attr('a-logid');
            sensorAlias += $(this).attr('a-salias');
            //alert($(this).attr('a-type'));
            alarmType += $(this).attr('a-type');
        });
    }

    $('#hAlarmType').val(alarmType);
    $('#salias').val(sensorAlias);
    $('#hlogids').val(logIds);

    createCloseAlarmDialog(ackRow, mode, logIds, sensorAlias, alarmType);
    ChangeAlarmType();
}

/*
*  For create dialog box to close alarm.
*/
function createCloseAlarmDialog(ackRow, ackMode, logIds, sensorAlias, alarmType, element) {
    $('#alarmClose_dialog').dialog("destroy");
    $('#alarmClose_dialog').dialog({
        autoOpen: true,
        modal: true,
        minWidth: 555,
        resizable: false,
        width: 555,
        buttons: {
            "Close Alarm": {
                text: "Close Alarm",
                'className': "yobutton",
                click: function () {    
                                
                    if (!window.opener.isSpclChar($("#description").val())) {
                        var actualType = "";

                        if (ackMode == 'single')
                            actualType = $("#ActualAlarm").val();

                        $.ajax({
                            type: "POST",
                            url: ("/Map/AcknoledgeAlarm/"),
                            cache: false,
                            data: "description=" + $("#description").val() + "&alarmType=" + alarmType + "&alarmlogId=" + logIds + "&actualTypeId=" + actualType,
                            success: function (msg) {
                                if (msg == "True") {                                    
                                    // Removing the rows acknowledged.
                                    ackRow.remove();
                                    showMessage({ 'msg': 'Alarm acknowledged successfully.', 'autoClose': true, 'className': 'success' });                                    
                                    if ($('.norecord', '#unAckBody').size() == 1)
                                        $('.norecord', '#unAckBody').remove();

                                    // If no active alarm remainig after removing the acknowledged show no alarm message.
                                    if ($('.active-alarm-row', '#ackAlarmTable').size() == 0)
                                        $('#ackAlarmTable', '#ackWrapper').append('<div class="norecord" style="padding:10px;">Currently there is no ceased alarm found.</div>');

                                    // increase the serial no by one.
                                    $('#AlarmTable label.a-sno').each(function (i, dt) {
                                        $(this).text(i + 1);
                                    });

                                    $('#ackAlarmTable label.u-sno').each(function (i, dt) {
                                        $(this).text(i + 1);
                                    });
                                }
                                $("#description").val("");
                            }
                        });
                        $(this).dialog("close");
                    }
                    else {
                        showMessage({ 'msg': 'Special characters are not allowed in acknowledge alarm comments.', 'autoClose': true, 'className': 'fail' });
                        setTimeout("closeMessage()",4000);
                    }
                }
            },
            "Cancel": function () {
                $("#description").val("");
                $('#alarmClose_dialog').dialog("destroy");
            }
        }
    });


    if (ackMode == 'single') {
        $('.single-ack-content').show();
        $("#ActualAlarm").find("option:contains('" + alarmType + "')").each(function () {
            if ($(this).text() == alarmType) {
                $(this).attr("selected", "selected");
            }
        });
    }
    else {
        $('.single-ack-content').hide();
    }
}

var camPTZ = [];

/*
*
*/
function doPTZForAlarm() {
    //alert('doPTZForAlarm call');
    var found = false;

    $('.active-alarm-row', '#AlarmTable').each(function (row, dt) {
        dt = $(this);
        found = false;
        for (var i = 0; i < camPTZ.length; i++) {
            //console.log("matching " + camPTZ[i].cam + " with " + dt.attr('cam'));
            if (camPTZ[i].cam == dt.attr('cam') && dt.attr('ptz') != "") {
                if (camPTZ[i].pr < dt.attr('pr'))
                    camPTZ[i].pr = dt.attr('pr');
                    //console.log('match');

                found = true;
            }
        }

        // if there is no entry of camera
        if (found == false && dt.attr('ptz') != "") {
           // console.log('new cam');
            camPTZ.push({ cam: dt.attr('cam'), pr: dt.attr('ptz') });
        }
    });

    // SEtting the cameras to to specific preset.
    if (window.opener.liveWin != null && typeof(window.opener.liveWin.doPTZForAlarm) != 'undefined' && camPTZ.length > 0) {   
        window.opener.liveWin.doPTZForAlarm(camPTZ);
    }
}

