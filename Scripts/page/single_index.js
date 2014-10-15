/*---------------------------------------------------------------\
+
+ Project     : Perimeter Intrusion Detection System
+ Filename    : single_index.js
+ Module Name : Script for Single Screen Dashboard Page.
+ Purpose     : The Dashboard view index page js file
+ Coded By    : Deepak Arora
+
+---------------------------------------------------------------*/

// Variable declaration.
var mon_name = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var plot_alarm_days;            // Keep Alarm days chart object.
var plot_zone_alarm;           // Keep plot zone alarm chart object.
var plot_heart_beat;            // keep plot zone alarm chart object.
var ZAPostBack = false;         // if GroupAlarm is loaded on click some filter button it will store true otherwise false.
var HBPostBack = false;         // if Heartbeate is loaded on click some filter button it will store true otherwise false.
var tAlarmDays;                 // keep object of alarm days.
var tZoneAlarm;                // keep object of zone alarm.
var heartBeat;                  // object of heart beat chart wrapper
var refreshXHR = null;
var ackRow = null;            // Stores the rows that are selected to be acknowledge.
var zoneAlarmButton = null;  // group alarm panel button active effect.
var heartBeatButton = null;   // heart beat panel button active effect.
var jqXHRZoneAlarm;
var pageLoadInverval;         // Store the interval of page to be reload(for browser memory leak fixing).
var urlData;                  // Store the parts of the URL.
var fullWin;                  // Store the object of video panel fullscreen window.
var fcount = 0;
var fullCamObj;               // Store the object of the camera details whose live feed choosen to be seen in full screen.

var ActiveAlarmLimit = -1;      // Limit for the active alarm to be fetched from db. //doubt
var alarm_panel_min_time = null;    // Alarm panel minimum time.
var alarm_panel_max_time = null;    // Alarm panel maximum time.
var historyXHR = null;
var activeXHR = null;
var poolingOn = false;
var initServer;
var camPTZ = [];

// Store the charts data filter ( chart is showing by( days, hour, week) and their value) [eg. for GroupAlarm chart ie.GA if want to see 2 week alarm 
// then by will store 'week' and val will store 2  ]
var GChartValue = { GA: { 'by': 'week', 'val': -1 }, HB: { 'by': 'day', 'val': -7} };

/* 
* This code will run when HTML load completes.
*/
$(function () {
    serverCheckWrapper = $('#serverCheckWrapper');
    contentVideo = $('#axPanel');

    $.jqplot.config.enablePlugins = true;   // For jqplot chart plugin support.
    dashboardAction();
    rowClickAction();   //doubt
    zoneAlarmButton = $(".barBtnGroupAlarm");
    heartBeatButton = $(".barBtnHeartbeat");
    //checkBoxAction();

    /*=============================================================================================*/
    /*     This section is used to maintain the site selection during automatic page refresh.      */
    /*=============================================================================================*/
    // URL Parsing [ Used to reload the page content ] 
    urlData = parseUri(document.URL);

    //doubt
    // console.dir(urlData);
    if (document.URL.indexOf('siteId') != -1) {
        selectedSiteName = $('input[name=site][value=' + urlData.queryKey.siteId + ']:radio').attr('sname');    // store the site name.        
        $('input[name=site][value=' + urlData.queryKey.siteId + ']:radio').attr("checked", true);
    }
    else {
        selectedSiteName = $('.rsite:first').attr('sname');
    }
    /*================ End auto page refresh default load =========================================*/

    // Getting the alarm notifications.[acknowledged and unacknoledged alarms].
    getActiveAlarms();
    //checkBoxAction();

    // Show the name of selected site on dashboard.
    $('#lblSiteName').text(selectedSiteName);

    // Checkbox and radio button check uncheck.
    /*$('table.popupTable tr').click(function () {
        var chk = $(this).find('input');
        if ($(this).find('input').attr('type') == 'radio')
            chk.attr('checked', 'checked');
        else
            chk.attr('checked', !chk.attr("checked"));


        if (chk.hasClass('mapdevice')) {
            mapDeviceSelect(chk, chk.attr('dtype'));
        }
    });
	*/
	
	// Checkbox and radio button check uncheck.
    $('table.popupTable tr td input:checkbox').click(function () {
        var chk = $(this);
		
        if(chk.attr('checked') == true){
		chk.attr('checked') = false;
		}
		else if(chk.attr('checked') == false){
		chk.attr('checked') = true;
		}

		mapDeviceSelect(chk, chk.attr('dtype')); 
        
    });

    $('.showNoti').click(function () {
        // if unacknowledge panel is clicked.
        if ($(this).attr('rel') == "active") {
            $('#unAckWrapper').show();
            $('#ackWrapper').hide()
            $('.ovropt').hide();
            showActiveAlarm();
        }
        else {
            $('#unAckWrapper').hide();
            $('#ackWrapper').show();
            $('.ovropt').show();
            showOverridedAlarm();
        }
    });

    if (navigator.appName == "Microsoft Internet Explorer")
        initServer = setTimeout("initializeVMSServer()", 4000);

    $('.chart').mouseleave(function () {
        $('.jqplot-highlighter-tooltip').hide();
    });


});

/*
* Code executes when window gets loaded [ HTML Loaded, css loaded, images loaded ] .
*/
$(window).load(function () {
    loadPageCharts(false);
    setChartInWrapper(false);

    $(window).resize(function () {
        setChartInWrapper(true);
    });
    isPostBack = true;
    $('.rsite:first').attr('checked', 'checked');
});

/*
* when user clicked 'Active' button.
*/
function showActiveAlarm() {
    
    // Getting the alarm notifications.[Acknowledged and unacknoqledged alarms].
    getActiveAlarms();
}

/*
*
*/
function showOverridedAlarm() {
    // Get the overrided alarms
    OverridedAlarm();
}


/*
* Get Overrided Alarms
*/
function OverridedAlarm() {
    if (historyXHR != null)
        historyXHR.abort();

    historyXHR = $.ajax({
        type: "GET",
        url: ("/Single/OverridedAlarm/"),
        cache: false,
        data: ({ siteId: selectedSite, limit: -1 }),
        success: function (msg) {
            $('#ackWrapper').html(msg);
            bindDetailEvent();
        }
    });
}

window.onbeforeunload = WindowCloseHanlder;
function WindowCloseHanlder() {
    if (navigator.appName == "Microsoft Internet Explorer") {
        // Stopping the video feed when Live Feed window is closed.    
        try {
            var ax = document.getElementById("Ax_Control");
            if (ax.status == 1) {
                ax.stop();
                ax.DisposeAll(true);
            }

        } catch (e) { alert('Stop Error in VMS Server -->' + e); }
    }
}

/*
* Map a device on map is click this callback function is called.
*/
function deviceClickCallBack(type, deviceId, sAlias) {
    if (type == 'sensor') {
        drawHeartBeatChart($('#hbContainer'), GChartValue.HB.by, GChartValue.HB.val, deviceId, sAlias);
    }
}

/*
* Load the page content in their panels.
*/
function loadPageCharts(isSiteChange) {
    // Drawing the group alarm chart.
    drawGroupAlarmChart($('#groupAlarmContainer'), GChartValue.GA.by, GChartValue.GA.val);

    if (!isSiteChange) {
        drawHeartBeatChart($('#hbContainer'), GChartValue.HB.by, GChartValue.HB.val, selectedSensor);
    }
    else {
        drawHeartForNewSite(selectedSite);
    }
}

/*
* This function refresh the map.
*/
function refreshMap() {
    loadSiteMapOnPage(selectedSite);
    $('.openPopup, #mapContainer').find(':checkbox').attr('checked', 'checked');
}

/*
* Chart button class set using script.
*/
function chartBtnAction() {
    zoneAlarmButton.click(function () {
        zoneAlarmButton.removeClass('toolbarButtonSelected');
        $(this).addClass("toolbarButtonSelected");
    });
    heartBeatButton.click(function () {
        heartBeatButton.removeClass('toolbarButtonSelected');
        $(this).addClass("toolbarButtonSelected");
    });
}

/*
* This funcition refresh the active alarm panel.
*/
function refreshActiveAlarm() {
    getActiveAlarms();  
}
/*
 * Get alarm notifications. 
 */
function getActiveAlarms() {

    refreshMap();   //we need to refresh map if there is no Data in DB. OR vsiu stops.(this activates when Active button is clicked) (Pankaj)
    $('#alarmLoading').show();
    $('#unAckWrapper').empty();

    if (activeXHR != null)  //activeXHR stores ajax request.it stores latest ajax request,initially it is null.
        activeXHR.abort();

    activeXHR = $.ajax({
        type: "GET",
        url: ("/Single/GetActiveAlarms/"),
        cache: false,
        data: ({ siteId: selectedSite, limit: ActiveAlarmLimit }),  //doubt
        success: function (msg) {
            $('#unAckWrapper').html(msg);
            checkBoxAction();
            bindDetailEvent();
        },
        complete: function () {
            $('#alarmLoading').hide();
            if (!poolingOn) {   //to ensure a continous connecion through comet,initially it is false.
                $.getScript("/Comet/LongPolling.js", function () {  //gets the script on run time.
                    initLongPolling();  //make the connection to DB & do the appropriate action when connection breaks
                    poolingOn = true;   //once JS is loaded , then we dont load it again.
                });
            }
        }
    });
}

/*
* Add New alarms in the alarm table. //doubt
*/
function addNewAlarms(jsonData) {
    var tempDate;
    var start_date;
    var start_time;
    var day; 
    var hours;
    var minutes;
    var seconds;
    var newAlarmRows = "";     

    if ($('.active-alarm-row', '#unAckWrapper').length == 0)
        $('#noActiveAlarm', '#unAckWrapper').remove();

    $.each(jsonData, function (i, dt) {        
        tempDate = new Date(parseInt(dt.st.slice(6, -2)));
        day = (parseInt(tempDate.getDate()) < 10) ? "0" + tempDate.getDate() : tempDate.getDate();
        start_date = day + "-" + mon_name[tempDate.getMonth()] + "-" + tempDate.getFullYear();

        hours = (parseInt(tempDate.getHours()) < 10) ? "0" + tempDate.getHours() : tempDate.getHours();
        minutes = (parseInt(tempDate.getMinutes()) < 10) ? "0" + tempDate.getMinutes() : tempDate.getMinutes();
        seconds = (parseInt(tempDate.getSeconds()) < 10) ? "0" + tempDate.getSeconds() : tempDate.getSeconds();
        start_time = hours + ":" + minutes + ":" + seconds;
        start_time_full = start_date + " " + start_time;

        newAlarmRows += '<div class="monitoringNotification geofenceViolationAlarm active-alarm-row" a-sid="' + dt.sId + '"  a-type="' + dt.nm + '" a-sdate="' + start_date + '" a-stime="' + start_time + '"' +
        ' a-zname="' + dt.zn + '" a-sha="' + dt.sha + '" a-logid="' + dt.id + '" ptz="' + dt.ptz + '"  pr="' + dt.pr + '" sev="' + dt.sev + '" cam="' + dt.cam + '">' +
        '<div class="notificationHeading">' +
        '<span class="labelContainer"><label for="' + dt.id + '" class="a-type">' + dt.nm + '</label><label>[At Sensor</label><b><label class="ms" title="Show on map">' + dt.sha + ']</label></b></span></div>' +
        '<div class="notificationContent"><div class="notificationDetail" style="display: none;">' +
        '<label class="nm">Sensor Name: <b>' + dt.nm + '</b></label><label class="zn">Zone: <b>' + dt.zn + '</b></label><br/><label> Date: <span class="a-sdt">' + start_date + '</span></label><label> Time: <span class="a-stm">' + start_time + '</span></label></div>' +
        '<label class="rtime">' + dt.rtime + '</label><label class="detail">Details</label></div><div class="clear"></div></div>';

        sensor_alert_status.push({ sId: dt.sId, img: 'sensor1.png', IsAlarm: 1 });

        if (i == jsonData.length - 1) {
            alarm_panel_max_time = start_date + " " + start_time;
        }
    });
    
    // Adding new alarms in notification panel.
    $(newAlarmRows).prependTo('#unAckWrapper');

    // Adding class as per the alarm type.
    //$('.overSpeedingAlarm', '#unAckWrapper').removeClass('overSpeedingAlarm');
    //$('.active-alarm-row:first', '#unAckWrapper').addClass('overSpeedingAlarm');


    var lastAlarm = $('.active-alarm-row:last', '#unAckWrapper');
    alarm_panel_min_time = lastAlarm.attr('a-sdate') + " " + lastAlarm.attr('a-stime');

   // rowClickAction(newAlarmRows);
    //alarmCheckBoxClickAction(newAlarmRows.find(':checkbox.check:first'));
    bindDetailEvent();
}


//doubt
function bindDetailEvent() {
    $('label.detail').unbind().bind('click', function (e) {
        //alert('a b' + $(this).parent().find('.notificationDetail').size());
        // alert($(this).parent().find('.notificationDetail').size());     
        e.stopPropagation();
        if (!$(this).hasClass('hide')) {
            $(this).text('Hide').addClass('hide');
            $(this).parent().find('.notificationDetail').slideDown('slow');

        }
        else {
            $(this).text('Detail').removeClass('hide');
            $(this).parent().find('.notificationDetail').slideUp('slow');
        }
    });
}

/*
* JSON Data of the alarms that are newly acknowledged.
*/
function updateAckAlarms(jsonData) {   
    $(jsonData).each(function (i, dt) {
        $('.active-alarm-row', '#unAckWrapper').each(function (j, row) {
            var current_row = $(this);
            if (current_row.attr('a-logid') == dt.id) {
                current_row.remove();
               
                if ($('.norecord', '#unAckBody').size() == 1)
                    $('.norecord', '#unAckBody').remove();

                //jQuery('body').showMessage({ 'thisMessage': ['Alarm has been acknowledged successfully.'], 'className': 'success', 'displayNavigation': false, autoClose: true });
                return false;
            }
        });
    });
}

/*
* 
*/
function ChangeAlarmType() {
    var value = $("#ActualAlarm option:selected").text();
    $('tr.controlButtons').hide();
    $('tr[id="' + value + '"]').show();
}

// For Acknowledge alarm.
function acknoledgeAlarm(mode, obj, event) {   
    var ackRow;
    var logIds = "";
    var sensorAlias = "";
    var alarmType = "";

    // If single alarm acknowledged is clicked.
    if (mode == "single") {
        ackRow = $(obj).parent().parent();

        if (ackRow.attr('a-ctime') == "-" || ackRow.attr('a-ctime') == "") {
            showMessage({ 'msg': 'Only closed alarms can be acknowledged.', 'autoClose': true,'className': 'fail' });            
            return false;
        }

        logIds = ackRow.attr('a-logid');
        sensorAlias = ackRow.attr('a-sha');
        $('#lblStartTime').text(ackRow.attr('a-sdate') + " " + ackRow.attr('a-stime'));
        $('#lblHWAlias').text(ackRow.attr('a-sha'));
        $('#lblZName').text(ackRow.attr('a-zn'));
        alarmType = $(ackRow).attr('a-type');        
    }
    else { // If multiple alarm acknoledged is clicked.    
        ackRow = $('input[type=checkbox]:checked', '#ackWrapper').parent().parent();

        if (ackRow.length <= 0) {
            showMessage({ 'msg': 'Kindly select at least one alarm to acknowledge.', 'autoClose': true, 'className' : 'fail' });
            return false;
        }

        var canAck = true;
        ackRow.each(function () {
            if ($(this).attr('a-ctime') == "-" || $(this).attr('a-ctime') == "") {
                showMessage({ 'msg': 'Could not acknowledge because there are some alarms that are active.', 'autoClose': true, 'className': 'fail' });
                canAck = false;
                return false;
            }

            if (logIds !== "")
                logIds += ",";

            if (sensorAlias !== "")
                sensorAlias += ",";

            if (alarmType !== "")
                alarmType += ",";

            logIds += $(this).attr('a-logid');
            sensorAlias += $(this).attr('a-sha');
            alarmType += $(this).attr('a-type');
        });

        if (!canAck)
            return;
    }

    $('#hAlarmType').val(alarmType);
    $('#salias').val(sensorAlias);
    $('#hlogids').val(logIds);

    createCloseAlarmDialog(ackRow, mode, logIds, sensorAlias, alarmType);
    ChangeAlarmType();
}

/*
*  For create dialog box to close alarm.
*///uc
function createCloseAlarmDialog(ackRow, ackMode, logIds, sensorAlias, alarmType, element) {
    $('#alarmClose_dialog').dialog("destroy");
    $('#alarmClose_dialog').dialog({
        autoOpen: true,
        modal: true,
        minWidth: 555,
        width: 555,
        buttons: {
            "Close Alarm": {
                text: "Close Alarm",
                'className': "yobutton",
                click: function () {
                    if (!isSpclChar($("#description").val())) {
                        var actualType = $("#ActualAlarm").val();
                        if (ackMode == 'single')
                            actualType = $("#ActualAlarm").val();

                        $.ajax({
                            type: "POST",
                            url: ("/Map/AcknoledgeAlarm/"),
                            cache: false,
                            data: "description=" + $("#description").val() + "&alarmType=" + alarmType + "&alarmlogId=" + logIds + "&actualTypeId=" + actualType,
                            success: function (msg) {
                                if (msg == "True") {
                                    $('#unAckWrapper').append(ackRow)
                                    // If no active alarm remainig after removing the acknowledged show no alarm message.
                                    if ($('.active-alarm-row', '#unAckWrapper').size() == 0)
                                        $('#unAckWrapper').append('<div class="norecord" style="padding:10px;">Currently there is no active alarm found.</div>');
                                }
                                $("#description").val("");
                            }
                        });

                        $(this).dialog("close");
                    }
                    else {
                        showMessage({ 'msg': 'Special characters are not allowed in acknowledge alarm comments.', 'autoClose': true, 'className': 'fail' });
                        setTimeout("closeMessage()", 4000);
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
    }
    else {
        $('.single-ack-content').hide();
        $('#Intrusion_Detection').css('display', 'none');

        $("#ActualAlarm").find("option:contains('" + alarmType + "')").each(function () {
            if ($(this).text() == alarmType) {
                $(this).attr("selected", "selected");
            }
        });
    }
}

// For acknoledge alarm
function closeAlarm(obj) {
    ackRow = $(obj).parent().parent();
    var element = $(obj);
    var sensorId = element.attr('sensorid').split(',');
    var LogId = element.attr('logid');

    $.ajax({
        type: "GET",
        url: ("/Map/GetAlarmForClose/"),
        data: ({ logId: LogId, sensorAlias: sensorId[0] }),
        cache:false,
        success: function (msg) {
            $('#alarmClose_dialog').html(msg);
            createCloseAlarmDialog(obj);
            $("#alarmClose_dialog").dialog('open');
            ChangeAlarmType();
        }
    });
}

/*
* This function Updates the existing alarm.
*/
function updateExistingAlarms(jsonData) {
    var cease_time = null;
    var tempDate;
    var start_date;
    var start_time;
    var hours;
    var minutes;
    var seconds;
    var day;
    var overrideBit = false;

    //var removeAlertOnSensor = [];
    $(jsonData).each(function (i, dt) {
        // if alarm overrided.
        if (dt.isOver == true) {
            tempDate = new Date(parseInt(dt.ctime.slice(6, -2), 10));
            day = (parseInt(tempDate.getDate()) < 10) ? "0" + tempDate.getDate() : tempDate.getDate();
            hours = tempDate.getHours();
            minutes = tempDate.getMinutes();
            seconds = tempDate.getSeconds();

            if (hours < 10) { hours = "0" + tempDate.getHours(); }
            if (minutes < 10) { minutes = "0" + parseInt(tempDate.getMinutes(), 10); }
            if (seconds < 10) { seconds = "0" + tempDate.getSeconds(); }
            cease_time = day + "-" + mon_name[tempDate.getMonth()] + "-" + tempDate.getFullYear() + " " + hours + ":" + minutes + ":" + seconds;
        }
        else {
            cease_time = "-";
        }

        $('.active-alarm-row','#unAckWrapper').each(function (j, row) {
            var current_row = $(this);
            if (current_row.attr('a-logid') == dt.id) {
                current_row.attr('a-type', dt.nm);
                current_row.find('label.a-type:first').text(dt.nm);

                //current_row.find('span.a-st:first').text(last_time);
                //current_row.attr('a-st', last_time);
                current_row.find('label.rtime:first').text(dt.rtime);

                if (dt.isOver == true) {
                    current_row.remove();
                    overrideBit = true;
                    /*current_row.attr('a-ctime', cease_time);
                    current_row.find('span.a-ctime:first').text(cease_time);
                    current_row.find('label.lblCesaeTime:first').show();
                    current_row.find('.accept:first').css('color', '').attr({ "title": 'Acknowledge alarm', "onclick": "javascript:acknoledgeAlarm('single',this,event);" }).find('img:first').attr('src', '../../Content/css/images/icons/tick_icon1.png');

                    // Change the color as per acknowledge alarm.
                    current_row.removeClass('overSpeedingAlarm').removeClass('geofenceViolationAlarm ').addClass('fuelAlarm');*/
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
    if(overrideBit)
        OverridedAlarm();

    if ($('.active-alarm-row', '#unAckWrapper').size() <= 0)
        $('#noActiveAlarm').css('display', 'block');

    if ($('.active-alarm-row', '#ackWrapper').size() <= 0)
        $('#noOvrAlarm').css('display', 'block');

    if (sensor_alert_status.length > 0) {      
        myMap.sensoralert(sensor_alert_status);     
    }
}

/*
*   //doubt
*/
function checkBoxAction() {
    var $headerSelector = $("div#checkBoxAction").find("table.popupTable");
    var $containCheckbox = $("#unAckWrapper").find(".monitoringNotification").find(":checkbox");
    var $statusCheckbox = $("#checkBoxStatus");

    $statusCheckbox.click(function (e) {
        e.stopPropagation();
         if ($("#unAckWrapper").find(".monitoringNotification").length > 0) {
            if ($statusCheckbox.hasClass('checkAll')) {
                $statusCheckbox.removeClass('checkAll');
                $headerSelector.find("#noneCheckbox").trigger('click');
            }
            else if ($statusCheckbox.hasClass('checkPartial')) {
                $statusCheckbox.removeClass('checkPartial');
            }
            else {
                $statusCheckbox.addClass('checkAll');
                $headerSelector.find("#allCheckbox").trigger('click');
            }
        }
    });

    $headerSelector.find("#allCheckbox").click(function (e) {
        e.stopPropagation();
        if ($("#ackWrapper").find(".monitoringNotification").length > 0) {
            $statusCheckbox.removeClass('checkPartial').addClass('checkAll');
            $("#ackWrapper").find(".monitoringNotification").find(":checkbox").attr('checked', 'checked');
            $(".popup").hide();
            $('.openPopup').removeClass('active');
        }
    }).end().find("#noneCheckbox").click(function (e) {
        e.stopPropagation();
        if ($("#ackWrapper").find(".monitoringNotification").length > 0) {
            $statusCheckbox.removeClass('checkAll checkPartial');
            $("#ackWrapper").find(".monitoringNotification").find(":checkbox").removeAttr('checked');
            $(".popup").hide();
            $('.openPopup').removeClass('active');
        }
    });
    
 $('.notificationHeading input[type="checkbox"]', '#unAckWrapper').click(function (e) {
       e.stopPropagation();
    });
    $('.notificationHeading input[type="checkbox"]', '#unAckWrapper').change(function (e) {

        e.stopPropagation();
        var totalCheckBox = $('.notificationHeading input[type="checkbox"]', '#unAckWrapper').length;
        var totalChecked = $('.notificationHeading input:checked', '#unAckWrapper').length;
        // If all checkbox are checked.
        if (totalCheckBox == totalChecked) {
            $statusCheckbox.removeClass('checkPartial').addClass('checkAll');
        }
        else if (totalChecked == 0) {
            $statusCheckbox.removeClass('checkAll checkPartial');
        }
        else {
            $statusCheckbox.removeClass('checkAll').addClass('checkPartial');
        }
    });   

    var $acknowledgeHeader = $("#checkedAction").find("table.popupTable");
    $acknowledgeHeader.find("#ackAll").click(function (e) {
        e.stopPropagation();
        var logIds = geofenceViolationAlarmLogId();
        $('#checkedAction').hide();
        $('.openPopup').removeClass('active');
    });
}

/*
* This function returns the all checked alarm's log id.
*/
function geofenceViolationAlarmLogId() {
    var logid = [];
    $('.notificationHeading input:checked', '#unAckWrapper').each(function () {
        logid.push($(this).parent().parent().attr('a-logid'));
    })
    return logid;
}


/*-------------- Chart Draw Functionality  Start---------------------*/

function refreshGroupAlarm() {
    drawGroupAlarmChart($('#groupAlarmContainer'), GChartValue.GA.by, GChartValue.GA.val);
}

/*
* Refresh the HeartBeat Chart.
*/
function refreshHeartBeat() {
    drawHeartBeatChart($('#hbContainer'), GChartValue.HB.by, GChartValue.HB.val, selectedSensor);
}

/*
* Turn on the camera live feed.
*/
function viewCamLiveFeed(camName) {    
    if (navigator.appName == "Microsoft Internet Explorer") {    
        if (!vms_connected) 
            showMessage({ 'msg': 'Unable to establish connection with VMS server. ', 'autoClose': true, 'className': 'fail', delayTime: 5000 });                    
        else
            TurnOnCamera(camName);
    }
    else {
        showMessage({ 'msg': 'Live feed functionality is currently available in Internet Explorer only.', 'autoClose': true, 'className': 'fail',delayTime : 5000 });
        return false;
   }    
}

/*
* Turning on the Live Feed in the corrosponding Video Frame.
*/
function TurnOnCamera(camName) {

    // Get the index of the camera details received from VMS layer.
    var vmsIndex = getCameraDetails("Axis_Dev_Room");
    //alert(vmsIndex); //pankaj
    var id = 1;
    // If camera not found.
    if (vmsIndex >= 0) {
        var obj = {};
        obj.user = user[vmsIndex];
        obj.pass = pass[vmsIndex];
        obj.id = camid[vmsIndex];
        obj.url = cameraurl[vmsIndex];
        obj.cname = camname[vmsIndex];
        obj.surl = streamingurl[vmsIndex];
        obj.status = 1;
        obj.ptz = supportedptz[vmsIndex];
        obj.continousptz = supportcontinousptz[vmsIndex];
        obj.ax = "Ax_Control";
        
        TakeAction(obj);
    }
    else {
        jQuery('body').showMessage({ 'thisMessage': ['No camera found for live coverage.'], 'className': 'fail', 'displayNavigation': false, autoClose: true });
        $('#showMessage').css('left', parseInt((screen.width / 2) - ($('#showMessage').width() / 2)));
        return false;
    }
}








// This function load the stream in the live feed window.
function TakeAction(obj) {
    var Ax_Control = document.getElementById('Ax_Control');
   // alert("take action"); //pankaj
    try {       
        // Stream video from VMS Server.
        Start_Streamer_OnServer(obj.cname);
        Ax_Control.cam = obj.cname;

        //console.log("id = " + obj.id + "\n CamName = " + obj.cname + "\nurl = " + obj.url + "\n user = " + obj.user + "\npassword= " + obj.pass + "\n" + obj.ax + ":" + obj.cam);
        var temp = Ax_Control.Play(obj.id, obj.cname, obj.url, obj.user, obj.pass, false, (obj.ax + ":" + obj.cam));
        Ax_Control.status = 1;  // status denotes video is playing.
        Ax_Control.videoid = obj.id; // video id is the id number of cam. It is random but can't be same for two cameras.
    } catch (e) {
        if (navigator.appName == "Microsoft Internet Explorer")
            showMessage({ 'msg': 'Live feed functionality is currently available in Internet Explorer only.', 'autoClose': true, 'className': 'fail' });
    }
    return;
}


/*
* This function locks the ActiveX control to load new video.
*/
function LockVideo(Ax_Control) {
    // If video is not playing.
    if (Ax_Control.status == 0) {
        return;
    } else {
        $(Ax_Control).parent().parent().find("div.lock").toggleClass("lockActive"); //lock button active effect
        $(Ax_Control).parent().parent().toggleClass('lockBorder');
        $(Ax_Control).parent().parent().find('.mainLock').toggleClass('lockedVideo');
        //  $(Ax_Control).parent().toggleClass('lockedVideo');
        Ax_Control.locked = (Ax_Control.locked == 1) ? 0 : 1;
    }
}

//         $$$$ Under Progress $$$$$         //
// ---- For Full Screen Video Live Feed ----//
function FullScreen(Ax_Control) {   
    //ActiveX status = 1 means video is playing in that.
    if (Ax_Control.status == 1) {
        // if no video is playing in fullscreen        
        if (Maximized_Ax_Control == null) {
            OpenFullScreenWindow($(Ax_Control).attr('axindex'));

            Maximized_Camera = Ax_Frames[Ax_Control.axindex];
            Maximized_Ax_Control = Ax_Control;
        }
    }
}

/*
* Call on live feed load complete.
*/
function LiveFeedLoadComplete() {
    window.opener.liveWin = window;
}

// Restore the video from fullscreen to restored activeX.
function RestoreVideo() {
    var temp = Maximized_Ax_Control.Play(Maximized_Camera.id, Maximized_Camera.cname, Maximized_Camera.url, Maximized_Camera.user, Maximized_Camera.pass, false, (Maximized_Camera.ax + ":" + Maximized_Camera.cam));
    Maximized_Camera = {};
    Maximized_Ax_Control = null;
    return;
}

/*
* Open the FullScreen video.
*/
function OpenFullScreenWindow(frame) {
    fullWin = window.open('../Video/Fullscreen', 'FullScreen', "width=" + (window.screen.width) + 40 + ", height=" + (window.screen.width) + 40 + ",top=" + 0 + ", left=" + 0 + ", location=no, menubar=no, scrollbars=no, status=no, toolbar=no,resizable=1,copyhistory= no,fullscreen=no");
    fullCamObj = Ax_Frames[frame];   
}

/*
* Call on fullscreen load completes.
*/
function onFullScreenLoad() {
    fullWin.liveFeedLoadComplete(fullCamObj);
}

/* 
* Function to access live video.
*/
function videoPanelAction() {
    $(".lock").click(function () { //on click lock button
        $(this).parent().parent().find('.lockedVideo').toggle(); // find current video and show or hide lock(red)
        $(this).parent().parent().toggleClass('lockBorder'); // find current video and show or hide border(red)
    });
}

/*
* Call on record video button click.
*/
function RecordVideo(Ax_Control) {
    var recordButton = $('.record');
    
    if (Ax_Control.status == 1) {
        if (Ax_Control.recording != 0) {
            //Record(Ax_Control);
            $('.record').removeClass('recordOff').addClass('recordOn');  
        }
        else {
            $('.record').addClass('recordOff').removeClass('recordOn');       
        }
    }
    else {
        showMessage({ 'msg': 'No video is running in the player.', 'autoClose': true, 'className': 'fail' });        
    }
}

/*
* Calling the PRSET GO for cameras.
*/
function doPTZForAlarm(camPTZ) {
    if (camPTZ) {
        var found = false;
        $('.active-alarm-row', '#unAckWrapper').each(function (row, dt) {
            dt = $(this);
            found = false;
            for (var i = 0; i < camPTZ.length; i++) {
                //console.log("matching " + camPTZ[i].cam + " with " + dt.attr('cam'));
                if (camPTZ[i].cam == dt.attr('cam') && dt.attr('ptz') != "") {
                    if (camPTZ[i].pr < dt.attr('pr'))
                        camPTZ[i].pr = dt.attr('pr');

                    found = true;
                }
            }

            // if there is no entry of camera
            if (found == false && dt.attr('ptz') != "") {
                // console.log('new cam');
                camPTZ.push({ cam: dt.attr('cam'), pr: dt.attr('ptz') });
            }
        });

        // Setting the cameras to to specific preset.
        if (camPTZ.length > 0 && vms_connected) {
            for (i in camPTZ) {
                if (camPTZ.hasOwnProperty(i)) {
                    if (typeof(console) != 'undefined')
                        console.log('Setting the camera ' + camPTZ[i].cam + ' to preset ' + camPTZ[i].ptz);

                    presetgo(camPTZ[i].cam, camPTZ[i].pr)
                }
            }
        }
    }
}

// Initializing the VMS Server. This must be synchronous request. Because it loads some script that we need to interact with
// VMS server. so don't remove async: false property. 
function initializeVMSServer() {
    $.ajax(
        {
            type: "GET",
            url: "/Single/InitializeVMSServer",
            async: false,
            success: function (result) {                
                if (result.status != false) {  // if successfully interact with vms server.                               
                    serverCheckWrapper.hide();
                    contentVideo.show();
                    $('body').append(result.camdata);                    
                    vms_connected = true;
                    clearTimeout(initServer);
                }
                else { // if there is some problem in interacting with vms server.
                    serverCheckWrapper.show();
                    contentVideo.hide();
                }
            },
            error: function (err) { }
        });
    }


    /*
    * $$$$ Under Progress $$$$$         
    * For PTZ Screen Video Live Feed
    */
    function PTZScreen(Ax_Control) {
        //ActiveX status = 1 means video is playing in that.
        if (Ax_Control.status == 1) {
            // if no video is playing.
            if (Ax_Control.ptz == true) {
                if (PTZ_Ax_Control == null) {
                    OpenPTZScreenWindow($(Ax_Control).attr('axindex'));
                    PTZ_Ax_Control = Ax_Control;
                }
            }
            else {
                jQuery('body').showMessage({ 'thisMessage': ['This camera do not support PTZ.'], 'className': 'fail', 'displayNavigation': false, autoClose: false });
                $('#showMessage').css('left', parseInt((document.body.offsetWidth / 2) - ($('#showMessage').width() / 2)));
            }
        }
    }

    /*
    * Open the PTZ video.
    */
    function OpenPTZScreenWindow(frame) {
        ptzWin = window.open('../Video/Ptz', 'PTZ', "width=" + 510 + ", height=" + 302 + ",top=" + 0 + ", left=" + 0 + ", location=no, menubar=no, scrollbars=no, status=no, toolbar=no,resizable=1,copyhistory= no,fullscreen=no");
        ptzCamObj = Ax_Frames[frame];
    }

    /*
    * Call on PTZ Screen load completes.
    */
    function onPTZScreenLoad() {
        $(ptzWin).resize(function () {
            ptzWin.resizeTo(510, 302);
        });
        ptzWin.ptzLoadComplete(ptzCamObj);
    }