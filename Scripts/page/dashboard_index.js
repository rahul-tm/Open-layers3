/*---------------------------------------------------------------\
+
+ Project     : Perimeter Intrusion Detection System
+ Filename    : dashboard_index.js
+ Module Name : Script for Three Screen Dashboard Page.
+ Purpose     : The Dashboard view index page js file
+ Coded By    : Deepak Arora
+
+---------------------------------------------------------------*/

// Variable Declaration.
var mon_name = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var selectedSiteName;
var plot_alarm_days = null;            // plot Alarm days chart.
var plot_zone_alarm = null;           // plot Group alarm chart.
var plot_heart_beat = null;
var GChartValue = { GA: { 'by': 'week', 'val': -1 }, HB: { 'by': 'day', 'val': -7} };
var tAlarmDays;
var tZoneAlarm;
var heartBeat;
var HBPostBack = false;
var jqXHRZoneAlarm;

$(function () {
    $.jqplot.config.enablePlugins = true;
    dashboardAction();
    initChartButtons();
    loadScreens();

    // URL Parsing [ Used to reload the page content ] 
    urlData = parseUri(document.URL);
    if (document.URL.indexOf('siteId') != -1) {
        selectedSiteName = $('input[name=site][value=' + urlData.queryKey.siteId + ']:radio').attr('sname');    // store the site name.        
        $('input[name=site][value=' + urlData.queryKey.siteId + ']:radio').attr("checked", 'checked');
    }
    else {
        selectedSiteName = $('.rsite:first').attr('sname');
        $('.rsite:first', '#sitePopup').attr("checked", 'checked');
    }


    // Show the name of selected site on dashboard.  
    $('#lblSiteName').text(selectedSiteName);

    // Bind event of site row click select the site.
    $('table.popupTable tr', '#sitePopup').click(function () {
        var row = $(this);
        if (row.find('label.lblSite:first').size() > 0)
            row.find('input[type=radio]').attr('checked', 'checked');
    });

    $('.chart').mouseleave(function () {        
        $('.jqplot-highlighter-tooltip').hide();
    });
});

/* 
* Code executes when window gets loaded [ HTML Loaded, css loaded, images loaded ] .
*/
$(window).load(function () {
    loadPageContent(selectedSite, false);
    setChartInWrapper(false);

    $(window).resize(function () {
        setChartInWrapper(true);
    });

    isPostBack = true;    
});

function refreshCameraInfo() {
    // Get the cameras info for the selected site.
    camerasInfo(selectedSite);
}

/*
* Loads the page contents.
*/
function loadPageContent(selectedSite, isSiteChange) {
    // Get data for analysis table on dashboard.
    getAnalysisData(selectedSite, reportDays);

    // Drawing the days alarms chart.
    drawDaysAlarmChart(daysAlarm);

    // Drawing the group alarm chart.
    drawGroupAlarmChart($('#groupAlarmContainer'), GChartValue.GA.by, GChartValue.GA.val);

    // Get the cameras info for the selected site.
    camerasInfo(selectedSite);

    if (!isSiteChange) {
        drawHeartBeatChart($('#hbContainer'), GChartValue.HB.by, GChartValue.HB.val, selectedSensor);
    }
    else {
        drawHeartForNewSite(selectedSite);
    }
}

/*
* Draw heartbeat from map page.
*/
function loadHeartBeatFromMap(deviceId, sAlias) {
    selectedSensor = deviceId;
    drawHeartBeatChart_Alias($('#hbContainer'), GChartValue.HB.by, GChartValue.HB.val, deviceId, sAlias);
}

/* 
* Getting analysis data and displaying in Grid.
*/
function getAnalysisData(selectedSite, reportDays) {
    if (isNaN(reportDays))
        reportDays = -365;

    var summary = $('#AnaylysisPanel');
    summary.find('.innerLeft:first').hide();
    summary.find('.innerLeftLoading').show();

    $.ajax({
        url: "/Dashboard/GetAnalysisData?siteId=" + selectedSite + "&days=" + reportDays,
        dataType: "json",
        cache: false,
        success: function (data, textStatus, jqXHR) {
            //===== Set data in analysis panel =======
            var analysis = $('#tblAnalysis');
            analysis.find('#nv').text(data.NV); // nv = No. of VSIU
            analysis.find('#ns').text(data.NS); // ns = No. of Sensors
            analysis.find('#ca').text(data.CA); // ca = No. of Current Alarms
            analysis.find('#mag').text(data.MAG != null ? data.MAG : "-"); // mag = Max. Alarm Group

            summary.find('#totWeekAlarm').text(data.WA);
            summary.find('#totMonthAlarm').text(data.MA);
            summary.find('#totQtrAlarm').text(data.QA);
            summary.find('#totWeekFalse').text(data.WF);
            summary.find('#totMonthFalse').text(data.MF);
            summary.find('#totQtrFalse').text(data.QF);
            //=========================================
        },
        error: function (jqXHR, textStatus, errorThrown) {
            if (typeof ('console') != 'undefined') {
                console.log(textStatus);
                console.log("\n\n-----jqxhr-------\n" + jqXHR);
            }
        },
        complete: function () {            
            summary.find('.innerLeftLoading').hide();
            summary.find('.innerLeft:first').show();
        }
    });
}

/*
* Draw the days alarm chart for the given days.
*/
function drawDaysAlarmChart(days) {
    tAlarmDays = $('#tAlarmDays');
    $('.innerRightLoading').show();

    $.ajax({
        url: "/Dashboard/AlarmBetweenDays?siteId=" + selectedSite + "&days=" + days,
        dataType: "json",
        cache: false,
        success: function (result, textStatus, jqXHR) {
            $('.innerRightLoading').hide();
            var line1 = [];
            var max = 0;
            var d = 4;

            if ($('#alarmDaysContatiner').height() < 250)
                d = 3;

            $.each(result.data, function (i, dt) {
                line1.push([parseInt(result.data[i].Date.slice(6, -2)), result.data[i].NoOfAlarm]);
                                
                if (result.data[i].NoOfAlarm > max)
                    max = result.data[i].NoOfAlarm;
            });         
           
            max = (max - (max % d) + (d * 2));
            $('#tAlarmDays').height($('.innerRight:first').height()).width($('.innerRight:first').width() - 20).css('display', 'block');

          
            // Drawing the day alarm chart.
            plot_alarm_days = $.jqplot('tAlarmDays', [line1], {
                animate: true,
                animateReplot: true,
                cursor: {
                    show: false,
                    zoom: false,
                    looseZoom: false,
                    showTooltip: true
                },
                seriesDefaults: {
                    showMarker: true,
                    pointLabels: { show: true },
                    min: 0
                },
                axes: {
                    xaxis: {
                        //label: 'Days(last 25 days)',
                        renderer: $.jqplot.DateAxisRenderer,
                        tickOptions: {
                            min: result.data[0].date,
                            max: result.data[(days * -1) - 1].date,
                            tickInterval: '5 day',
                            formatString: '%d-%b'
                        },
                        pad: 2.3
                    },
                    yaxis: {
                        labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
                        min: 0,
                        max: max,
                        tickOptions: { formatString: '%d', tickInterval: max / d }
                    }
                },
                highlighter: {
                    show: true,
                    showLabel: true,
                    tooltipAxes: 'xy',
                    sizeAdjust: 7.5,
                    tooltipLocation: 'w',
                    showTooltipPrecision: 0.5, //tooltipFormatString 
                    formatString: '<table class="jqplot-highlighter"><tr><td style="display:inline;">Alarm Date: </td><td style="display:inline;">%s</td></tr><tr><td>Total Alarm: </td><td>%s</td></tr></table>'
                },

            });

            $('<div class="my-jqplot-title" style="position:relative;margin-left:40px;color:#6a6a6a;text-align:left;opacity:.4;font-size:12px;padding-top: 15px;width:100%;z-index:999;">Last 25 Days Alarms</div>').insertAfter('.jqplot-grid-canvas:first');
            $('.innerRightLoading').hide();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            $('.innerRightLoading').hide();
            if (typeof ('console') != 'undefined') {
                console.log("Error\n------------\n" + textStatus + "\n\n-----jqxhr-------\n" + jqXHR);
            }
        },
        complete: function () {
            if ($.active <= 1)
                $('.innerRightLoading').hide();

            tAlarmDays.show();
        }
    });
}

/*
* Getting the camera information for the selected site.
*/
function camerasInfo(selectedSite) {    
    var camContainer = $('#cameraContainer');
    camContainer.find('.rightUpperLoading:first').show();
    camContainer.find('#cameraPanel:first').css('visibility', 'hidden');

    $.ajax({
        url: "/Dashboard/CamerasInfo?siteId=" + selectedSite,
        cache: false,
        success: function (data, textStatus, jqXHR) {
            $('#cameraPanel', '#cameraContainer').html(data);          
        },
        complete: function () {            
            camContainer.find('.rightUpperLoading:first').hide();
            camContainer.find('#cameraPanel:first').css('visibility','visible');

        }
    });
}

/*
* Getting the live feed from camera.
*/
function getLiveFeed(camName) {    
    if (typeof (console) != 'undefined')
        console.log("Getting live feed from camera " + camName);

    if (liveWin)
        liveWin.TurnOnCamera(camName);
}

/*
* Initializes the events on chart filter buttons.
*/
function initChartButtons() {
    $(".barBtnLeft").click(function () {
        $(".barBtnLeft").removeClass('toolbarButtonSelected');
        $(this).addClass("toolbarButtonSelected");
    });
    $(".barBtnRight").click(function () {
        $(".barBtnRight").removeClass('toolbarButtonSelected');
        $(this).addClass("toolbarButtonSelected");
    });
}

/*
* Update the values in existing alarms showing in the alarm panel.
*/
function updateExistingAlarms(jsonData) {
    var cease_time = null;
    var tempDate;
    var start_date;
    var start_time;
    var hours;
    var minutes;
    var seconds;

    //var removeAlertOnSensor = [];
    $(jsonData).each(function (i, dt) {
        if (dt.ctime != null && parseInt(dt.ctime.slice(6, -2), 10) > 0) {
            tempDate = new Date(parseInt(dt.ctime.slice(6, -2), 10));

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

        if (dt.lastTime != null && parseInt(dt.lastTime.slice(6, -2), 10) > 0) {
            tempDate = new Date(parseInt(dt.lastTime.slice(6, -2), 10));
            hours = tempDate.getHours();
            minutes = tempDate.getMinutes();
            seconds = tempDate.getSeconds();

            if (hours < 10) { hours = "0" + tempDate.getHours(); }
            if (minutes < 10) { minutes = "0" + parseInt(tempDate.getMinutes(), 10); }
            if (seconds < 10) { seconds = "0" + tempDate.getSeconds(); }

            last_time = hours + ":" + minutes + ":" + seconds;
        }
        else {
            last_time = "-";
        }

        
        $('.active-alarm-row').each(function (j, row) {
            var current_row = $(this);

            if (current_row.attr('a-logid') == dt.logid) {
                current_row.find('td.a-lasttime').text(last_time);
                current_row.find('td.a-ctime').text(cease_time);

                current_row.attr('a-lasttime', last_time);
                current_row.attr('a-ctime', cease_time);

                // Breaking out jquery each loop.
                return (false);             
            }
        });

        var found = false;
        for (var k = 0; k < sensor_alert_status.length; k++) {
            if (sensor_alert_status[k].alias == dt.salias) {
                if (sensor_alert_status[k].IsAlarm == 0 && dt.isOverride == false) {
                    sensor_alert_status[k].IsAlarm = 1;
                }

                found = true;
                break;
            }
        }

        if (found == false) {
            sensor_alert_status.push({ alias: dt.salias, img: 'sensor1.png', IsAlarm: (dt.isOverride == true) ? 0 : 1 });
        }
    });

    if (sensor_alert_status.length > 0) {        
        myMap.sensoralert(sensor_alert_status);     
    }
}

function viewCamLiveFeed(camId) {
    if (liveWin) {
        TurnOnCamera(camName);
    }
}

/*----------------- Page Refreshing -------------*/

/*
* Responsible for left panel refreshing, it includes refresh of analysis, group alarm and days alarm.
*/
function refreshLeftpanel() {
    // Get data for analysis table on dashboard.
    getAnalysisData(selectedSite, reportDays);

    // Drawing the days alarms chart.
    $('#tAlarmDays').html('');
    drawDaysAlarmChart(daysAlarm);

    // Drawing the group alarm chart.
    $('#tZoneAlarm').html('');
    drawGroupAlarmChart($('#groupAlarmContainer'), GChartValue.GA.by, GChartValue.GA.val);
}

/*
* Responsible for left panel refreshing, it includes refresh of analysis, group alarm and days alarm.
*/
function refreshRightpanel() {
    // Draw the heartbeat Chart.
    $('#tHeartBeat').html('');
    drawHeartBeatChart($('#hbContainer'), GChartValue.HB.by, GChartValue.HB.val, selectedSensor);
}