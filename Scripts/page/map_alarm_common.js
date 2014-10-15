/*---------------------------------------------------------------\
+
+ Project     : Perimeter Intrusion Detection System
+ Filename    : map_alarm_common.js
+ Module Name : Script for Maps alarm monitoring
+ Purpose     : JS for Map and alarm function that are common for single as well as three screen.
+ Coded By    : Deepak Arora
+ Date        : Jun 11, 2012 19:43:33 2010 -0500
+  
+---------------------------------------------------------------*/

/* 
* Variable Declaration
*/
var myMap = null;
var alarm_panel_min_time = null;
var alarm_panel_max_time = null;
var refreshXHR = null;
var sensor_alert_status = [];
var mon_name = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var noti_show = 1;
var noti_unread = 0;
var lastNewAlarms = {};
var lastExistingAlarms = {};
var lastAckAlarms = {};
var camAutoMove = 1;

//var vms_connected = true; //pankaj

/*
* Call when window loads completly
*/
$(window).load(function () {
    // Load the site Map on the page.
    loadSiteMapOnPage(selectedSite);

    //Loading the "video_index.js"  script to provide the video functionality when alert is present on some sensor. //pankaj
    //require("/Scripts/page/video_index.js");
});

/*
*
* Right side panel to select which object to show/hide on map. sunil's function as per item checked/unchecked.
*/
function mapDeviceSelect(element, type) {
    //console.log('element : ' + element  + " ,  type : " + type);
    switch (type) {
        case ('vsiu'):
            if ($(element).is(':checked'))
                myMap.showZones();
            else
                myMap.hideZones();
            break;
        case ('sensor'):
            if ($(element).is(':checked'))
                myMap.showSensors();
            else
                myMap.hideSensors();
            break;
        case ('camera'):
            if ($(element).is(':checked'))
                myMap.showCamera();
            else
                myMap.hideCamera();
            break;
        default:
    }

    return false;
}

/*
* Loads the Site Map. Get Site data from db and plot the map.
*/
function loadSiteMapOnPage(siteId) {
    //Getting the site data[Zones, Sensor Lines, Sensors, cameras, Points].
    getSiteData(siteId);
}

/*
*  Get data for draw map for site.
*/
function getSiteData(siteId) {
    // gettting the site map data. passing the site id and time to avoid cache problem
    $.getJSON("/Map/GetDataForSiteMap/", { siteId: siteId, t: (new Date()).getTime() }, function (jsonData) {
        if (jsonData.success) {
            drawMap(jsonData.result);

            //console.log(jsonData.result); //pankaj
        }
    });
}

/*
*   Get site data from JSON file.
*/
function drawMap(siteData) {
    //alert("hi");
    // show loadig on map panel.
    $('.loading:first', '#mapContainer').css('display', 'block');

    // Get the site map data.
    $.getJSON("/Content/PFMap/mapInfo.json", { t: (new Date()).getTime() }, function () {
    }).success(function (mapInfoJson) {
        var zoom = 3;
        var isSingle = false;
        var setX = 500;
        var setY = 500;

        // $('#divSiteMap', '#mapContainer').removeClass('mapLoader');

        if (template == "OneScreen") {
            isSingle = true;
            zoom = 2;
            setX = 400;
            setY = 500;
        }

        // passing the required parameter to load map.
        var options = { 'deviceClickCallback': function (type, deviceId, sAlias) { mapDeviceClickHandler(type, deviceId, sAlias); }, 'zoom': zoom, 'minZoom': 2, 'maxZoom': 4, 'isSingle': isSingle, 'setX': setX, 'setY': setY };

        // Calling suni's funcion and pass site data, json data,and map options.
        myMap = new pfMap(mapInfoJson, document.getElementById("divSiteMap"), siteData, options);
    }).complete(function () {
        // hide the map loading
        $('.loading:first', '#mapContainer').css('display', 'none');
    });
}

/*
* callback function of map device click.
*/
function mapDeviceClickHandler(type, deviceId, sAlias) {
    // If template layout is single screen.
    if (template == "OneScreen") {
        if (type == 'sensor')
            drawHeartBeatChart_Alias($('#hbContainer'), GChartValue.HB.by, GChartValue.HB.val, deviceId, sAlias);
        else
            viewCamLiveFeed(deviceId);
    }
    else {  // If template layout is three screen.
        if (type == 'sensor') {
            if (window.opener)
                window.opener.loadHeartBeatFromMap(deviceId, sAlias);
        }
        else {
            cameraLiveFeed(deviceId);
        }
    }

    // If camera is click
    if (type == 'camera')
        myMap.changeMultipleCameraImg([{ id: deviceId, isOn: 1}]);
}


//Loading the "video_index.js"  script to provide the video functionality when alert is present on some sensor. //pankaj
function require(script) {
    $.ajax({
        url: script,
        dataType: "script",
        async: false,           // <-- this is the key
        success: function () {
            //alert("got script");
        },
        error: function () {
            throw new Error("Could not load script " + script);
        }
    });
}



/*
* Get alarm notifications. This will call on connection break of Commet server.
*/
function getRefresh() {


    //  If request already in process abort it.
    if (refreshXHR != null) {
        refreshXHR.abort();
        refreshXHR = null;
    }

    var url;
    if (template == "OneScreen")
        url = "/Map/RefreshDashboard/";
    else
        url = "/Map/RefreshDashboard2/";

    refreshXHR = $.post(url, { siteId: selectedSite, startTime: alarm_panel_min_time, endTime: alarm_panel_max_time, limit: -1, t: (new Date()).getTime() }, function (jsonData) {

        //var activeCam = jsonData.result.existingAlarm[0].cam;   //getting the Active cam for active alert //pankaj
        //alert(activeCam); //pankaj

        

        //ImmdiateTurnOnCamera(activeCam); //pankaj--> to ON the camera on Immediate alert on sensor.


        if (jsonData.success) {
            sensor_alert_status = [];

            // Updating the existing alarms
            if (jsonData.result.existingAlarm.length > 0 && !Object.equals(lastExistingAlarms, jsonData.result.existingAlarm)) {
                updateExistingAlarms(jsonData.result.existingAlarm);
            }

            // If there are some new alarms.
            if (jsonData.result.alarm.length > 0) {
                addNewAlarms(jsonData.result.alarm);
            }

            if (jsonData.result.alarm.length > 0 || jsonData.result.existingAlarm.length > 0)
                doPTZForAlarm();

            // Drawing the sensor alert status.
            if (sensor_alert_status.length > 0) {
                // Set the image of sensor accoring to it's alert status
                myMap.sensoralert(sensor_alert_status);
            }

            // Move camera to the sensor having alarm.
            if (camAutoMove == 1)
                controlCamPTZ(jsonData.result.alarm, jsonData.result.existingAlarm);

            // Creating the polylines where alarming sensor exist.
            addAlertLine(jsonData.result.alertLines);


            // If no changes in alarm data.
            if (Object.equals(lastNewAlarms, jsonData.result.alarm) && Object.equals(lastExistingAlarms, jsonData.result.existingAlarm)) {
                // If no changes in alarm data.
            }

            else { // If there are change in  alarm data.
                lastNewAlarms = jsonData.result.alarm;
                lastExistingAlarms = jsonData.result.existingAlarm;
            }
        }
        else if (jsonData.success == false) {
            setTimeout('getRefresh();', 3000);
        }

    }, "json")
    .complete(function () { refreshXHR = null; })
    .error(function () { });

    //.complete(function () { refreshXHR = null; clearInterval(pageLoadInverval); pageLoadInverval = setInterval('getRefresh()', 10000); })
}




/*
* Show the notification icon.
*/
function notificationAlert(counter) {
    $("#notification").addClass("setAlert").find("#counter").show().text("" + counter + "");
}

/*
* Reset the notification.
*/
function notificationReset() {
    $("#notification").removeClass("setAlert").find("#counter").hide();
}

/*
* This function call the function to show the alert line on map.
*/
function addAlertLine(jsonData) {
    //console.log(jsonData);
    myMap.lineAlert(jsonData);
}

/*
*  When click on any alarm it will highlight the sensor 
*  that is involved in this alarms on Map.
*/
function rowClickAction() {
    $('.active-alarm-row').live('click', function () {
        if (template == 'OneScreen') {
            myMap.showSelectedSensor($(this).attr('a-sid').split(','));
            $('.monitoringNotification').removeClass('active');
            $(this).addClass('active');
        }
        else {
            myMap.showSelectedSensor($(this).attr('a-sid').split(','));
            $('.contentpartcontainer').removeClass('active');
            $(this).addClass('active');
        }
    });
}

/*
* Binding the click event on alarm check boxes.
*/
function alarmCheckBoxClickAction(checkBoxes) {
    var checks = $('.notificationHeading input:checkbox', '#unAckWrapper')
    /*--- If Alarm Check box checked/unchecked ---*/
    checks.live('click', function (event) {
        event.stopPropagation();
    });
    //Toggle between check and uncheck.
    checks.live('change', function (event) {
        if ($('.check', '#AlarmTable').length == $('.check:checked', '#AlarmTable').length) {
            $('.checkall', '#unAckWrapper').attr('checked', 'checked');
        }
        else {
            $('.checkall', '#unAckWrapper').removeAttr('checked');
        }
    });
}

/*
*
*/
function controlCamPTZ(newAlarm, existingAlarm) {
    //jsonObj = [ "cam" : "AXIS_192.168.1.130", 'isptz' : 1, 'preset' : 3, 'sev' : 9, 'pr' : 3 ];
}