/*---------------------------------------------------------------\
+
+ Project     : Perimeter Intrusion Detection System
+ Filename    : common.js
+ Module Name : Script common for Three Screen & single screen both.
+ Purpose     : The Dashboard view index page js file
+ Coded By    : Deepak Arora
+
+---------------------------------------------------------------*/

/*
*  variable declaration
*/
var PopUp = null; //variable for all the popup
var PopupOpener = null; //variable for popupopener on this click popup is open
var closeButton = null; //this button close the popup
var showField = null;

/*
* This code will call when user changes a site.
*/
function changeSite(event) {
    /*-- Get the Site Id of the first site that is selected, from the site site dropdown. --*/
    selectedSite = $('#sitePopup').find('input[type=radio]:checked:first').val();

    // Rediect the page to the dashboard page and pass the SiteId, selected Sensor Alias.
    window.location.href = urlData.protocol + "://" + urlData.host + ":" + urlData.port + urlData.path + "?siteId=" + selectedSite + "&sa=" + selectedSensor;
}

/*
* Initialize the page default actions and event registering.
*/
function dashboardAction() {
    PopUp = $(".popup"); //store the popup
    PopupOpener = $('.openPopup'); //store the popupOpener
    closeButton = $(".closeArea"); //this button close the popup    
    initPopup(); /*all the defalt action and body click action are occur by this function*/
    arrowClickAction(); //by this function when click on popup opener then popup is open or close
    closeButtonAction(); //by this when click on button then popup are hide
    chartBtnAction(); //function to use tabs functionality on toolbar buttons               
}

/*
* Initializes the popup functionality [ show / hide].
*/
function initPopup() {//default action
    // Hide the popup when initialize.
    PopUp.hide();

    // Remove the active class from popup. [active class is attached with popup when it is open. ]
    PopupOpener.removeClass('active');  //doubt

    // Hide the popup on click on body.
    $('body').click(function () {//body click action
        PopUp.hide();
        // Remove the active class from popup. [active class is attached with popup when it is open. ]
        PopupOpener.removeClass('active');
    });
}

/*
* Event binding of arrow dropdown button. [Popup opens on clicking arrow icon.]
* This is the event handling code of click on popup arrow icon click
*/
function arrowClickAction() {//by this function when click on popup opener then popup is open or close
    PopupOpener.click(function (e) {
        e.stopPropagation();    //Prevents the event from bubbling up the DOM tree-->prevent the propogation of that event to parents.

        PopupOpener.removeClass('tempPop');
        PopUp.removeClass('tempopup');
        var $this = $(this);

        $this.addClass('tempPop').find('.popup').addClass('tempopup');

        // check how much popups are open and which popup I want to show
        $.each(PopupOpener, function () {
            var $this = $(this);
            if ($this.hasClass('tempPop')) {
            }
            else {
                $this.removeClass('active').find('.popup').hide();
            }
        });

        // if popup is visible then hide it.
        if ($this.find(".popup").is(":visible")) {
            $this.removeClass('active').find(".popup").hide();
        } else { // else show it.
            $this.addClass('active').find(".popup").show();
        }
    });

    PopUp.click(function (e) {
        e.stopPropagation(); //to stop body click action on the popup
    });
}

/*
*  This function Closes the popup.
*/
function closeButtonAction() { //by this when click on button then popup are hide
    closeButton.click(function (e) {
        e.stopPropagation();
        PopUp.hide();
        PopupOpener.removeClass('active');
    });
}

/*
* Initialized the chart buttons.
*/
function chartBtnAction() {
    // Left side window's buttons click[ set the selected class on buttons.].
    $(".barBtnLeft").click(function () {
        $(".barBtnLeft").removeClass('toolbarButtonSelected');  // Remove selected class from previously selected button.
        $(this).addClass("toolbarButtonSelected");              // Add selected class on button which is clicked.
    });

    // Right side window's buttons click[ set the selected class on buttons.].
    $(".barBtnRight").click(function () {
        $(".barBtnRight").removeClass('toolbarButtonSelected');    // Remove selected class from previously selected button.
        $(this).addClass("toolbarButtonSelected"); 			   // Add selected class on button which is clicked.
    });
}

/*
* This function is used to check in special characters.
*/
function isSpclChar(str) {
    var iChars = "!@#$%^&*()+=-[]\\\';/{}|\":<>?";

    // Check if any invalid charcter is found in the string passed in the function.
    for (var i = 0; i < str.length; i++) {
        if (iChars.indexOf(str.charAt(i)) != -1) {
            return true;
        }
    }
    return false;
}

/*
* This function draw the Sensor Heartbeat graph.
*/
function drawHeartBeatChart(container, filterBy, filterValue, sensorId) {
    selectedSensor = sensorId;
    container = $('#hbContainer');
    container.find('.loading').show();  //initially loading shows
    container.find('#tHeartBeat').hide();   //HeartBeat table hides.

    $.ajax({
        url: "/Dashboard/HeartBeat?sensorId=" + sensorId + "&filterBy=" + filterBy + "&filterValue=" + filterValue,
        dataType: "json",
        cache: false,
        success: function (jsonData, textStatus, jqXHR) {
            if (jsonData.length > 0) {
                //var found = false;

                $('#lblHBSensor').text(" for " + sensorId);
                var line1 = [];
                var max = 0;
                var d = 4;
                if ($('#tHeartBeat').height() < 250)
                    d = 3;

                //taking maximum of alarms.
                $.each(jsonData, function (i, dt) {
                    if (jsonData[i].AlarmValue > max)
                        max = jsonData[i].AlarmValue;

                    var dateString = parseInt(jsonData[i].AlarmTime.slice(6, -2));  //right date format-->According to our requirement 
                    line1.push([dateString, parseInt(jsonData[i].AlarmValue)]);
                });

                max = (max - (max % d) + (d * 2));

                container.find('.chart:first').height(container.height()).width(container.width() - 20);    //Setting the container
                container.find('.chart:first').html('');        //initially NO html.

                // Now Drawing the HeartBeat Chart.
                plot_heart_beat = $.jqplot('tHeartBeat', [line1], {
                    animate: !$.jqplot.use_excanvas,    //doubt
                    animateReplot: true,
                    cursor: { show: false, zoom: false, looseZoom: false, showTooltip: false },
                    seriesDefaults: { showMarker: true, pointLabels: { show: true} },
                    axes: {
                        xaxis: { renderer: $.jqplot.DateAxisRenderer, pad: 2.3,
                            tickOptions: { formatString: (filterBy == "day") ? '%d-%b-%y' : '%H:%M:%S' }, min: (line1[0][0] - 50000), max: (line1[line1.length - 1][0] + 50000)
                        },
                        yaxis: { labelRenderer: $.jqplot.CanvasAxisLabelRenderer, pad: 2.3, min: 0, max: max, tickOptions: { formatString: '%d', tickInterval: max / d} }
                    },
                    legend: { show: false },
                    highlighter: { show: false }
                });

                /*--- Bind the hover event for Chart tooltip . --*/
                container.bind('jqplotDataHighlight',
                        function (ev, seriesIndex, pointIndex, data) {
                            var temp = $('#hbContainer').width();
                            var tempDate = new Date(parseInt(jsonData[pointIndex].AlarmTime.slice(6, -2)));
                            var day = (parseInt(tempDate.getDate()) < 10) ? "0" + tempDate.getDate() : tempDate.getDate();  //setting '0' infront of one-digit dates.
                            var date_final = day + "-" + mon_name[tempDate.getMonth()] + "-" + tempDate.getFullYear();

                            var hours = (parseInt(tempDate.getHours()) < 10) ? "0" + tempDate.getHours() : tempDate.getHours();
                            var minutes = (parseInt(tempDate.getMinutes()) < 10) ? "0" + tempDate.getMinutes() : tempDate.getMinutes();
                            var seconds = (parseInt(tempDate.getSeconds()) < 10) ? "0" + tempDate.getSeconds() : tempDate.getSeconds();

                            var time_final = hours + ":" + minutes + ":" + seconds;
                            var time_full = date_final + " " + time_final;

                            //doubt--point index
                            $('#chartpseudotooltip').stop().html("<table class=\"jqplot-highlighter\"><tr><td>" + ((filterBy == "day") ? "Alarm Date:" : "Alarm Date") + "</td><td>" + date_final + "</td></tr><tr><td>Avg. Alarm Value:</td><td>" + jsonData[pointIndex].AlarmValue + "</td></tr></table>").show();

                            var cssObj = {
                                'position': 'absolute',
                                'font-weight': 'bold',
                                'left': ((temp - ev.pageX) > 180) ? ev.pageX : (ev.pageX - 180) + 'px', //usually needs more offset here((temp - ev.pageX) > 100 ? ev.pageX : (ev.pageX - 130)) //doubt
                                'top': (ev.pageY - 55) + 'px'
                            };
                            $('#chartpseudotooltip').css(cssObj);
                        }
                    );
                //Fix-I tooltip - when mouse is out of window
                container.bind('jqplotDataUnhighlight', function (ev, pointIndex, data) {
                    $('#chartpseudotooltip').stop().css('display', 'none');
                });
                //Fix-II            
                console.dir(plot_heart_beat.series[0]);
                plot_heart_beat.series[0].highlightMouseOver = true;

                //Showing Title for HeartBeat Chart on Top-Left
                $('<div class="my-jqplot-title" style="position:absolute;text-align:left;margin-left:40px;color:#6a6a6a;opacity:.4;font-size:12px;padding-top: 15px;width:100%;z-index:999;">Sensor Heartbeat</div>').insertAfter('#hbContainer .jqplot-grid-canvas:first');
                setTimeout("setChartInWrapper(true)", 300);
            }
            //when No alrms comes then show message.
            else {
                $('#lblHBSensor').text("");
                container.find('.chart:first').html('<div style="padding: 10px;">No alarm during this period.</style>');
                plot_heart_beat = null;
            }

        },
        complete: function () {
            container.find('.loading:first').hide();
            container.find('.chart:first').show();
        }
    });
}



/*
* This function draw the Sensor Heartbeat graph.
*/
function drawHeartBeatChart_Alias(container, filterBy, filterValue, sensorId, sensorAlias) {
    selectedSensor = sensorId;
    container = $('#hbContainer');
    container.find('.loading').show();  //initially loading shows
    container.find('#tHeartBeat').hide();   //HeartBeat table hides.
    $.ajax({
        url: "/Dashboard/HeartBeat?sensorId=" + sensorId + "&filterBy=" + filterBy + "&filterValue=" + filterValue,
        dataType: "json",
        cache: false,
        success: function (jsonData, textStatus, jqXHR) {
            if (jsonData.length > 0) {

                $('#lblHBSensor').text(" for " + sensorAlias); //Set the heartbeat label according to sensor alias.

                var line1 = [];
                var max = 0;
                var d = 4;
                if ($('#tHeartBeat').height() < 250)
                    d = 3;

                //taking maximum of alarms.
                $.each(jsonData, function (i, dt) {
                    if (jsonData[i].AlarmValue > max)
                        max = jsonData[i].AlarmValue;

                    var dateString = parseInt(jsonData[i].AlarmTime.slice(6, -2));  //right date format-->According to our requirement 
                    line1.push([dateString, parseInt(jsonData[i].AlarmValue)]);
                });

                max = (max - (max % d) + (d * 2));

                container.find('.chart:first').height(container.height()).width(container.width() - 20);    //Setting the container
                container.find('.chart:first').html('');        //initially NO html.

                // Now Drawing the HeartBeat Chart.
                plot_heart_beat = $.jqplot('tHeartBeat', [line1], {
                    animate: !$.jqplot.use_excanvas,    //doubt
                    //animate: true,
                    animateReplot: true,
                    cursor: { show: false, zoom: false, looseZoom: false, showTooltip: false },
                    seriesDefaults: { showMarker: true, pointLabels: { show: true} },
                    axes: {
                        xaxis: { renderer: $.jqplot.DateAxisRenderer, pad: 2.3,
                            tickOptions: { formatString: (filterBy == "day") ? '%d-%b-%y' : '%H:%M:%S' }, min: (line1[0][0] - 50000), max: (line1[line1.length - 1][0] + 50000)
                        },
                        yaxis: { labelRenderer: $.jqplot.CanvasAxisLabelRenderer, pad: 2.3, min: 0, max: max, tickOptions: { formatString: '%d', tickInterval: max / d} }
                    },
                    legend: { show: false },
                    highlighter: { show: false }
                });

                /*--- Bind the hover event for Chart tooltip . --*/
                container.bind('jqplotDataHighlight',
                        function (ev, seriesIndex, pointIndex, data) {
                            var temp = $('#hbContainer').width();
                            var tempDate = new Date(parseInt(jsonData[pointIndex].AlarmTime.slice(6, -2)));
                            var day = (parseInt(tempDate.getDate()) < 10) ? "0" + tempDate.getDate() : tempDate.getDate();  //setting '0' infront of one-digit dates.
                            var date_final = day + "-" + mon_name[tempDate.getMonth()] + "-" + tempDate.getFullYear();

                            var hours = (parseInt(tempDate.getHours()) < 10) ? "0" + tempDate.getHours() : tempDate.getHours();
                            var minutes = (parseInt(tempDate.getMinutes()) < 10) ? "0" + tempDate.getMinutes() : tempDate.getMinutes();
                            var seconds = (parseInt(tempDate.getSeconds()) < 10) ? "0" + tempDate.getSeconds() : tempDate.getSeconds();

                            var time_final = hours + ":" + minutes + ":" + seconds;
                            var time_full = date_final + " " + time_final;

                            //doubt--point index
                            $('#chartpseudotooltip').stop().html("<table class=\"jqplot-highlighter\"><tr><td>" + ((filterBy == "day") ? "Alarm Date:" : "Alarm Date:") + "</td><td>" + date_final + "</td></tr><tr><td>Avg. Alarm Value:</td><td>" + jsonData[pointIndex].AlarmValue + "</td></tr></table>").show();

                            var cssObj = {
                                'position': 'absolute',
                                'font-weight': 'bold',
                                'left': ((temp - ev.pageX) > 180) ? ev.pageX : (ev.pageX - 180) + 'px', //usually needs more offset here((temp - ev.pageX) > 100 ? ev.pageX : (ev.pageX - 130)) //doubt
                                'top': (ev.pageY - 55) + 'px'
                            };
                            $('#chartpseudotooltip').css(cssObj);
                        }
                    );
                //Fix-I tooltip - when mouse is out of window
                container.bind('jqplotDataUnhighlight', function (ev, pointIndex, data) {
                    $('#chartpseudotooltip').stop().css('display', 'none');
                });
                //Fix-II            
                //console.dir(plot_heart_beat.series[0]);
                plot_heart_beat.series[0].highlightMouseOver = true;

                //Showing Title for HeartBeat Chart on Top-Left
                $('<div class="my-jqplot-title" style="position:absolute;text-align:left;margin-left:40px;color:#6a6a6a;opacity:.4;font-size:12px;padding-top: 15px;width:100%;z-index:999;">Sensor Heartbeat</div>').insertAfter('#hbContainer .jqplot-grid-canvas:first');
                setTimeout("setChartInWrapper(true)", 300);
            }
            //when No alrms comes then show message.
            else {
                $('#lblHBSensor').text("");
                container.find('.chart:first').html('<div style="padding: 10px;">No alarm during this period.</style>');
                plot_heart_beat = null;
            }

        },
        complete: function () {
            container.find('.loading:first').hide();
            container.find('.chart:first').show();
        }
    });
}



/*
* Get the first sensor of new site then draw the heartbeat for the sensor.
*/
function drawHeartForNewSite(selectedSite) {
    $.ajax({
        url: "/Dashboard/GetSiteSensor?siteId=" + selectedSite,
        dataType: "json",
        cache: false,
        success: function (data, textStatus, jqXHR) {
            if (data.status) {  //1 --> no error ::  0 ---> error

                selectedSensor = data.sid;
                drawHeartBeatChart($('#hbContainer'), GChartValue.HB.by, GChartValue.HB.val, selectedSensor);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            if (typeof ('console') != 'undefined') {
                console.log(textStatus);
                console.log("\n\n-----jqxhr-------\n" + jqXHR);
            }
        }
    });
}


/*
* This function draw the group alarm chart.
*/
function drawGroupAlarmChart(container, filterBy, filterValue) {
    //alert($('#tZoneAlarm').html(''));
    $('#tZoneAlarm').html('');          //setting 'nothing' initially.
    container.find('.loading').show();  //Show loading after finding loading class

    jqXHRZoneAlarm = $.ajax({
        url: "/Dashboard/ZoneAlarms?siteId=" + selectedSite + "&filterBy=" + filterBy + "&filterValue=" + filterValue,
        dataType: "json",
        cache: false,
        success: function (jsonData, textStatus, jqXHR) {
            if (jsonData.length > 0) {
                var data = [];
                var ticks = [];
                var found = false;
                var m = 0;

                $.each(jsonData, function (i, dt) {

                    if (jsonData[i].NoOfAlarm > 0)
                        found = true;

                    //taking maximum of alarms.
                    if (jsonData[i].NoOfAlarm > m)
                        m = jsonData[i].NoOfAlarm;

                    data.push(jsonData[i].NoOfAlarm);
                    ticks.push(jsonData[i].ZoneHardwareAlias);
                });

                //                if (!found) {
                //                    container.find('.chart:first').html('<div id="noActiveAlarm" style="padding: 10px;font-size:13px;">No alarm during this period.</div>')
                //                }
                //                else {
                container.find('.chart:first').height(container.height()).width(container.width()); //finding first member of class 'chart' and setting its hight & width.

                var max = (m - (m % 4) + 8);    //taking a property 'max' for plotting the graph's maximum peak.

                //Passing 'ID' and  'Data' to plot the graph.
                plot_zone_alarm = $.jqplot("tZoneAlarm", [data], {
                    animate: true,
                    animateReplot: true,
                    cursor: {
                        show: false,
                        zoom: false,
                        looseZoom: false,
                        /*constrainZoomTo: 'x',*/
                        showTooltip: false
                    },
                    seriesDefaults: {
                        renderer: $.jqplot.BarRenderer,
                        rendererOptions: {
                            barWidth: 30,
                            barPadding: 30,
                            fillToZero: true,
                            varyBarColor: true
                        },
                        min: 0,
                        pointLabels: { show: true, hideZeros: false }
                    },
                    axes: {
                        // Use a category axis on the x axis and use our custom ticks.
                        xaxis: {
                            /*label: 'Groups',*/
                            renderer: $.jqplot.CategoryAxisRenderer,
                            min: 0,
                            ticks: ticks,
                            drawMajorGridlines: false,
                            drawMinorGridlines: true,
                            drawMajorTickMarks: false,
                            rendererOptions: {
                                tickInset: 0.5,
                                minorTicks: 1
                            }
                        },
                        // Pad the y axis just a little so bars can get close to, but
                        // not touch, the grid boundaries.  1.2 is the default padding.
                        yaxis: {
                            labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
                            min: 0,
                            max: max,
                            tickOptions: { formatString: '%d', tickInterval: max / 4 }
                        }
                    },
                    highlighter: {
                        show: false
                    },
                    cursor: {
                        show: false
                    }
                });

                /*--- Bind the hover event of group alarm bars for showing tooltip. --*/
                container.bind('jqplotDataHighlight',
                        function (ev, seriesIndex, pointIndex, data) {
                            var mouseX = ev.pageX; //these are going to be how jquery knows where to put the div that will be our tooltip
                            var mouseY = ev.pageY;
                            //Showing a ToolTip table on Mouse Hover.[doubt]
                            $('#chartpseudotooltip').html("<table class=\"jqplot-highlighter\"><tr><td>Zone Name:</td><td>" + ticks[pointIndex] + "</td></tr><tr><td>Total Alarms:</td><td>" + data[1] + "</td></tr></table>").show();
                            var cssObj = {
                                'position': 'absolute',
                                'font-weight': 'bold',
                                'left': (mouseX + 20) + 'px', //usually needs more offset here
                                'top': mouseY + 'px'
                            };
                            //giving Styling to the ToolTip table.
                            $('#chartpseudotooltip').css(cssObj);
                        }
                    );

                /*--- Bind the hover out event of group alarm bars for showing tooltip. --*/
                container.bind('jqplotDataUnhighlight',
                        function (ev) {
                            $('#chartpseudotooltip').html('').hide();   //Hiding ToolTip table on MouseOut event.
                        }
                    );
                //}

                //Displaying Title of Zone Alarm chart on Top-Left
                $('<div class="my-jqplot-title" style="position:absolute;text-align:left;margin-left:40px;color:#6a6a6a;opacity:.4;font-size:12px;padding-top: 15px;width:100%;z-index:999;">Zone wise alarm</div>').insertAfter('#groupAlarmContainer .jqplot-grid-canvas:first');
            }
            //If no Alarms then Print the message.[doubt]
            else {
                container.find('.chart:first').html('<div id="noActiveAlarm" style="padding: 10px;font-size:13px;">No alarm during this period.</div>');
            }
        },
        complete: function () {
            container.find('.loading:first').hide();    //Loading stops
            container.find('.chart:first').show();      //Chart shows.
        }
    });
}


/*
* Set Chart in it's wrapper. This method is used to fit the chart in it's wrapper.
*/
function setChartInWrapper(isPostBack) {
    // Store the containers of the chart throughout the page.
    var container = $('.graphContainer');

    // Store the charts within those containers.
    var chart = $('.graphContainer').find('.chart:first');

    // Iterate throught all charts.
    $.each(chart, function (i, dt) {
        // Set the height and width of charts, as their containers and inside div.
        $(this).height(container.eq(i).height()).width(container.eq(i).find('div:first').width() - 20);
    });

    // 
    if (isPostBack) {
        // If zone alarm chart is defined on the page.
        if (typeof (plot_zone_alarm) != 'undefined' && plot_zone_alarm != null) {
            plot_zone_alarm.replot({ resetAxes: false });

            // Set the name of the chart within the chart container.	
            $('<div class="my-jqplot-title" style="position:absolute;text-align:left;margin-left:40px;color:#6a6a6a;opacity:.4;font-size:12px;padding-top: 15px;width:100%;z-index:999;">Zone wise alarm</div>').insertAfter('#groupAlarmContainer .jqplot-grid-canvas:first');
        }

        // If alarm days chart is defined on the page.
        if (typeof (plot_alarm_days) != 'undefined' && plot_alarm_days != null) {
            plot_alarm_days.replot({ resetAxes: false });

            // Set the name of the chart within the chart container.	
            $('<div class="my-jqplot-title" style="position:relative;margin-left:40px;color:#6a6a6a;text-align:left;opacity:.4;font-size:12px;padding-top: 15px;width:100%;z-index:999;">Last 25 Days Alarms</div>').insertAfter('.jqplot-grid-canvas:first');
        }

        // If Heartbeat chart is defined on the page.
        if (typeof (plot_heart_beat) != 'undefined' && plot_heart_beat != null) {
            plot_heart_beat.replot({ resetAxes: false });

            // Set the name of the chart within the chart container.	
            $('<div class="my-jqplot-title" style="position:absolute;text-align:left;margin-left:40px;color:#6a6a6a;opacity:.4;font-size:12px;padding-top: 15px;width:100%;z-index:999;">Sensor Heartbeat</div>').insertAfter('#hbContainer .jqplot-grid-canvas:first');
        }
    }
}

/*
* Filter the HeartBeat as per criteria. 
*/
function filterHeartBeat(filterBy, filterValue) {
    if (GChartValue.HB.by != filterBy || GChartValue.HB.val != filterValue) {
        $('#tHeartBeat').html('');

        GChartValue.HB.by = filterBy;
        GChartValue.HB.val = filterValue;

        // Drawing the heartbeat chart.
        drawHeartBeatChart($('#hbContainer'), filterBy, filterValue, selectedSensor);
    }
}

/*
*  Filter the Group alarm as per criteria. Handle the event when click on chart buttons. eg. 5 Hrs, 10 Hrs, 1 day, 2 day etc.
*/
function filterGroupAlarms(filterBy, filterValue) {
    if (GChartValue.GA.by != filterBy || GChartValue.GA.val != filterValue) {
        $('#tZoneAlarm').html('');
        // Drawing the group alarm chart.
        drawGroupAlarmChart($('#groupAlarmContainer'), filterBy, filterValue);
        GChartValue.GA.by = filterBy;
        GChartValue.GA.val = filterValue;
    }
}

/*
* This function add the given hours in the given date.
* myDate : Date in which we want to add hours.
* days : No. of hours that we want to add.
*/
function addHours(myDate, hours) {
    return new Date(myDate.getTime() + (hours * 60 * 60 * 1000));
}

/*
* Function used to add hours in a date.
*/
function addMinutes(myDate, minute) {
    return new Date(myDate.getTime() + (minute * 60 * 1000));
}

/*
* Function used to add hours in a date.
*/
function addDays(myDate, days) {
    return new Date(myDate.getTime() + days * 24 * 60 * 60 * 1000);
}

/*
*  Reloading the page. (Reload the page after some time, for browser hang fix, because of script load).
*/
function PageReload() {
    if (document.URL.indexOf('sid') != -1) {
        window.location.href = urlData.protocol + "://" + urlData.host + ":" + urlData.port + urlData.path + "?sid=" + selectedSite + "&sen=" + selectedSensor + "&gaby=" + GChartValue.GA.by + "&gav=" + GChartValue.GA.val + "&hbby=" + GChartValue.HB.by + "&hbv=" + GChartValue.HB.val + "&snm=" + selectedSiteName; ;
    }
    else {
        window.location.href = document.URL + "?sid=" + selectedSite + "&sen=" + selectedSensor + "&gaby=" + GChartValue.GA.by + "&gav=" + GChartValue.GA.val + "&hbby=" + GChartValue.HB.by + "&hbv=" + GChartValue.HB.val + "&snm=" + selectedSiteName;
    }
}