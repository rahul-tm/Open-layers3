/*
* Filename : pfMap.js
* Purpose : The javascript file responsible for the working of the 
* map service in PIDS project
*/

//Declaring global variable that store host address
//var hostAddress = "http://192.168.1.204:8081";
var hostAddress = "http://i.codescape.in:887";
var imagesPath = "Content/images/";
var lastInfoOpen = null; //contains the lastInfoWindow that is open
var myDiv; //Decalring variable that use to store the div that contains map
var tempMap = null; //this will store the current refrence of the pfMap Class
var hideFlag = null; //flag for the line alert
var showFlag = null; //Creating pfMap class
var lastHighlightedSensor = null;
var checkSensoronMap = true;
//this variable will check is there any sensor is higlighted(selected) on to the map
var checkHighlightedSensor = false;
var hideSensorFlag = false; //this will check if the sensor is present on screen or they are hide  on the map
var hideZoneFlag = false; //this will check if the Zones is present on screen or they are hide  on the map
var hideCameraFlag = false; //this will check if the Cameras is present on screen or they are hide  on the map
//this varibale hold the restricted extent at diffrent zoom levels
var extent = {
    // extentAtMaxZoom : new OpenLayers.Bounds(20, 10, 1100, 386)
    extentAtMinZoom: null,
    extentAtzoom2: null,
    extentAtzoom3: null,
    extentAtzoom4: null,
    extentAtMaxZoom: null
};
//this varibale hold the size of the sensors marker at the diffrent zoom levels
var iconSize = {
    sizeAtzoom2: {
        height: 70,
        width: 70,
        offsetX: -35,
        offsetY: -35
    },
    sizeAtzoom3: {
        height: 88,
        width: 88,
        offsetX: -44,
        offsetY: -42
    },
    sizeAtzoom4: {
        height: 100,
        width: 100,
        offsetX: -50,
        offsetY: -50
    }
};
//it contains the controls that will be shown on to the right click on to the map
var tempOptions = [
{
    menuName: "Unselect Sensor",
    menuFunction: "tempMap.removeSelectedSensor()",
    imgName: "unSelect.png"
},
{
    menuName: "Center map here",
    menuFunction: "tempMap.setCenterOnClick(event)",
    imgName: "centerMap.png"
},
{
    menuName: "Zoom in +",
    menuFunction: "tempMap.zoomInMap()",
    imgName: "zoomIn.png"
},
{
    menuName: "Zoom out -",
    menuFunction: "tempMap.zoomOutMap()",
    imgName: "zoomOut.png"
}
];
//creating the class pfMap
pfMap.prototype.constructor = pfMap;
//Constructor of pfMap class
function pfMap(mapInfo, mapDiv, mapOption, options) {
    this.mapContainer = $(mapDiv);
    //clearing anything if present in to the div
    mapDiv.innerHTML = "";
    //assigning the map holding div to the myDiv
    myDiv = mapDiv;
    //Reference variable to store object of Openlayers.Map class
    //Variable to store an instance of map
    this.map;
    //variable to hold the bounds for the map
    this.bound;
    //Reference variable to store alarm    
    this.myAlarm = new Array();
    //to store all the zones in to the map
    this.myZones = mapOption.zones;
    //stores the all the lines on which we got the alert
    this.lineOptions = mapOption.lines;
    this.bLines = mapOption.bLines;
    //---------------------------------------------------------------------------
    //assigning the details  of the sensors and camera to  coresponding array that will be used at the time we draw the sensors and camera on to the map
    this.mySensors = mapOption.sensors;
    this.myCamera = mapOption.camera;
    //-------------------------------------------------
    /*
    *these array will hold the details of the placed sensors,zones,cameras on to the map
    */
    this.myLayer = new Array();
    this.zones = new Array(); //holds all the zones
    this.zc = 0; //zone counter
    this.sensors = new Array(); //hold all the sensors on to the map
    this.sc = 0; //sensor counter
    this.camera = new Array(); //holds all the camera on to the map
    this.cc = 0; //camera counter
    this.lineAlerts = []; //this array will hold all the lines(red lines coming on to the map) that are showing alert b/w sensors 
    /*
    *this variable hold the property (function) that will be called at the time when we click on to the devices
    */
    this.devceClikCallback = options.deviceClickCallback;
    //Logic to load different map for differen site
    for (i in mapInfo.sites) {
        if (mapOption.sdetail.sId == mapInfo.sites[i].id) {
            //Creating an instance of map
            this.resetMapFlasg();
            this.bound = new OpenLayers.Bounds(mapInfo.sites[i].bound.minX, mapInfo.sites[i].bound.minY, mapInfo.sites[i].bound.maxX, mapInfo.sites[i].bound.maxY);
            this.extent = new OpenLayers.Bounds(mapInfo.sites[i].restrictedExtent.minX, mapInfo.sites[i].restrictedExtent.minY, mapInfo.sites[i].restrictedExtent.maxX, mapInfo.sites[i].restrictedExtent.maxY);
            this.map = new OpenLayers.Map(mapDiv, {
                maxExtent: this.bound,
                restrictedExtent: this.extent,
                maxResolution: mapInfo.sites[i].maxResolution,
                projection: mapInfo.sites[i].srs,
                units: 'm'
                ,
                controls: [
                new OpenLayers.Control.Navigation({
                    dragPanOptions: {
                        enableKinetic: true
                    }
                }),
                new OpenLayers.Control.PanZoom(),
                new OpenLayers.Control.Attribution()
                ]
            });
            for (j in mapInfo.sites[i].layers) {
                var b1 = (mapInfo.sites[i].layers[j].baselayer == 'true') ? true : false;
                this.myLayer[j] = new OpenLayers.Layer.WMS(mapInfo.sites[i].layers[j].title, hostAddress + '/geoserver/wms', {
                    layers: mapInfo.sites[i].layers[j].name
                    //,transparent: 'true'
                }, {
                    'isBaseLayer': b1
                }, {
                    'displayInLayerSwitcher': true
                });
                this.myLayer[j];
                this.map.addLayer(this.myLayer[j]);
            }
            this.map.setCenter(new OpenLayers.LonLat(mapInfo.sites[i].center.latitude, mapInfo.sites[i].center.longitude), options.zoom);
        }
    }
    tempMap = this; //assignig the current refrence
    $(window).resize(function () {
        tempMap.map.updateSize();
    });
    //Creating layers for markers
    this.vlayer = new OpenLayers.Layer.Vector('Feature Layer'); //vector layer that use to draw line
    this.map.addLayer(this.vlayer);
    this.lineAlertLayer = new OpenLayers.Layer.Vector('LineAlertLayer'); //line alert Layer to draw the alert lines(red lines coming on to the map)
    this.lineAlertLayer.setVisibility(true);
    this.map.addLayer(this.lineAlertLayer);
    this.markers = new OpenLayers.Layer.Markers("Markers"); //layer for sensors
    this.map.addLayer(this.markers);
    this.cmarkers = new OpenLayers.Layer.Markers("CMarkers"); //layer for camera
    this.map.addLayer(this.cmarkers);
    //-------------new code to draw the line ---------------
    // for (var i in this.myZones) {
    for (var j in this.bLines) {
        var points = new Array();
        for (var k in this.bLines[j].slCorrdinate) {
            points.push(new OpenLayers.Geometry.Point(this.bLines[j].slCorrdinate[k].slLg, this.bLines[j].slCorrdinate[k].slLt));
        }
        this.drawLine(points);
    }
    //  }
    //Adding camera to map
    for (i in this.myCamera) {
        this.camera[this.cc] = new Object();
        var m = this.addCameraMarker(new OpenLayers.Size(40, 40), this.myCamera[i]);
        m.id = this.myCamera[i].cId;
        m.type = 'camera';
        m.img = this.myCamera[i].img;
        this.camera[this.cc].s1 = m;
        m = this.addCameraMarker(new OpenLayers.Size(60, 60), this.myCamera[i]);
        m.id = this.myCamera[i].cId;
        m.type = 'camera';
        m.img = this.myCamera[i].img;
        this.cmarkers.removeMarker(m);
        this.camera[this.cc].s2 = m;
        m = this.addCameraMarker(new OpenLayers.Size(80, 80), this.myCamera[i]);
        m.id = this.myCamera[i].cId;
        m.type = 'camera';
        m.img = this.myCamera[i].img;
        this.cmarkers.removeMarker(m);
        this.camera[this.cc].s3 = m;
        this.cc++;
    }
    //Hiding camera from specified site
    /* if (mapOption.siteId != "d4a63dde-240c-4de1-899d-7eb789eda148")
    {
    this.hideCamera();
    }*/
    //Calling function to reset map
    this.resetMap();
    var m = this.map;
    var carray = this.camera;
    var cm = this.cmarkers;
    var cen = m.getCenter();
    var checkZoom = 2;
    //zoom events on to the map
    //chnaging the size of the markers
    //and checking for the layer is hidden or not
    m.events.register('zoomend', m, function (event) {
        $("#menu").css({
            display: 'none'
        });
        var x = m.getZoom();
        if (x < options.minZoom) {
            m.zoomTo(options.minZoom);
            m.setCenter(cen);
            //            tempMap.map.setOptions({
            //                restrictedExtent: extent.extentAtMinZoom
            //            });
            //tempMap.chnageMapSize();
        }
        if (x == 2) {
            for (var i = 0; i < tempMap.sensors.length; i++) {
                tempMap.sensors[i].icon.size.h = iconSize.sizeAtzoom2.height;
                tempMap.sensors[i].icon.size.w = iconSize.sizeAtzoom2.width;
                tempMap.sensors[i].icon.offset.x = iconSize.sizeAtzoom2.offsetX;
                tempMap.sensors[i].icon.offset.y = iconSize.sizeAtzoom2.offsetY;
                tempMap.sensors[i].draw();
                if (hideSensorFlag == true)
                    tempMap.markers.removeMarker(tempMap.sensors[i]);
            }
            for (var j in tempMap.zones) {
                tempMap.markers.addMarker(tempMap.zones[j]);
                if (hideZoneFlag == true)
                    tempMap.markers.removeMarker(tempMap.zones[j]);
            }
            //            tempMap.map.setOptions({
            //                restrictedExtent: extent.extentAtzoom2
            //            });
        }
        if (x == 3) {
            for (var i = 0; i < tempMap.sensors.length; i++) {
                tempMap.sensors[i].icon.size.h = iconSize.sizeAtzoom3.height;
                tempMap.sensors[i].icon.size.w = iconSize.sizeAtzoom3.width;
                tempMap.sensors[i].icon.offset.x = iconSize.sizeAtzoom3.offsetX;
                tempMap.sensors[i].icon.offset.y = iconSize.sizeAtzoom3.offsetY;
                tempMap.sensors[i].draw();
                if (hideSensorFlag == true)
                    tempMap.markers.removeMarker(tempMap.sensors[i]);
            }
            for (var j in tempMap.zones) {
                tempMap.markers.addMarker(tempMap.zones[j]);
                if (hideZoneFlag == true)
                    tempMap.markers.removeMarker(tempMap.zones[j]);
            }
            //            tempMap.map.setOptions({
            //                restrictedExtent: extent.extentAtzoom3
            //            });
        }
        if (x == 4) {
            for (var i = 0; i < tempMap.sensors.length; i++) {
                tempMap.sensors[i].icon.size.h = iconSize.sizeAtzoom4.height;
                tempMap.sensors[i].icon.size.w = iconSize.sizeAtzoom4.width;
                tempMap.sensors[i].icon.offset.x = iconSize.sizeAtzoom4.offsetX;
                tempMap.sensors[i].icon.offset.y = iconSize.sizeAtzoom4.offsetY;
                tempMap.markers.addMarker(tempMap.sensors[i]);
                tempMap.sensors[i].draw();
                if (hideSensorFlag == true)
                    tempMap.markers.removeMarker(tempMap.sensors[i]);
            }
            for (var j in tempMap.zones) {
                tempMap.markers.addMarker(tempMap.zones[j]);
                if (hideZoneFlag == true)
                    tempMap.markers.removeMarker(tempMap.zones[j]);
            }
            //            tempMap.map.setOptions({
            //                restrictedExtent: extent.extentAtzoom4
            //            });
        }
        if (x > options.maxZoom) {
            m.zoomTo(options.maxZoom);
            //            tempMap.map.setOptions({
            //                restrictedExtent: extent.extentAtMaxZoom
            //            });
            //tempMap.chnageMapSize();
        }
    });
    /*stoping the default right click event*/
    $(mapDiv).bind("contextmenu", function (event) {
        event.preventDefault();
    });
    //binding the context menue to the map that will be open when we rightclick on to the map
    this.contextMenu(mapDiv, tempOptions); //create the right click menu
    this.bindcontextMenu(); //bind the events on to the menu
    m.events.triggerEvent('zoomend', m); //triggering the zoom event
    if (options.isSingle == true) {
        this.map.setCenter(new OpenLayers.LonLat(options.setX, options.setY), options.zoom);
    }
}

//Function to draw line
pfMap.prototype.drawLine = function (points) {
    //creating an instance of OpenLayers.Geometry.LineString class
    var line = new OpenLayers.Geometry.LineString(points);
    //alert(line);
    //instantiaing OpenLayers.Feature.Vector class
    var vector = new OpenLayers.Feature.Vector(line, {}, {
        strokeColor: '#ff9933',
        strokeOpacity: 1,
        strokeWidth: 5
    });
    //Adding current vector feature to vector layer
    this.vlayer.addFeatures([vector]);
}
//------------------------------------------------------------------------------
//add the markers on to the map create the infowindow of the marker
pfMap.prototype.addMarker = function (size, object) {
    var img;
    if (object.type == 'Sensor') {
        if (object.IsAlarm == 0) {
            if (object.img != null) {
                img = imagesPath + object.img;
            }
            else {
                img = imagesPath + "sensor1.png";
            }
        }
        else if (object.IsAlarm == 1) {
            if (object.img != null) {
                var imageName = object.img.split(".");
                img = imagesPath + imageName[0] + "_alert.gif";
            }
            else {
                img = imagesPath + "sensor1_alert.gif"
            }
        }
    }
    else if (object.type == 'Zone')
        if (object.img != null)
            img = imagesPath + object.img;
        else
            img = imagesPath + "zone1.png";
    //defining offset of marker icon
    var mpos = new OpenLayers.LonLat(object.lg, object.lt);
    var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h / 2);
    //creating an instance of OpenLayers.Icon class 
    var icon = new OpenLayers.Icon(img, size, offset);
    //Creating an instance of OpenLayers.Marker class
    var marker = new OpenLayers.Marker(mpos, icon);
    marker.type = object.type;
    if (object.type == 'Sensor') {
        marker.deviceId = object.sAlias;
    }
    if (object.type == 'Zone')
        marker.deviceId = object.zId;
    //Adding current marker to markers array
    //alert(marker);
    this.markers.addMarker(marker);
    if (object.type == 'Zone')
        var info = "<div class='outerDivZone'>" +
        "<div class='tableDiv'>" +
        "<table class = 'tblSkyBlue'>" +
        "<thead>" +
        "<tr>" +
        "<th colspan =\"2\"class='title'>VSIU Details</th>" +
        "</tr>" +
        "</thead>" +
        "<tbody>" +
        "<tr>" +
        "<td class='head'>Name</td>" +
        "<td class='info'>" + object.zname + "</td>" +
        "</tr>" +
        "<tr>" +
        "<td class='head'>Alias</td>" +
        "<td class='info'>" + object.zAlias + "</td>" +
        "</tr>" +
        "<tr>" +
        "<td class='head'>IP Address</td>" +
        "<td class='info'>" + object.zIp + "</td>" +
        "</tr>" +
        "<tr>" +
        "<td class='head'>Mac Address</td>" +
        "<td class='info'>" + object.zMac + "</td>" +
        "</tr>" +
        "<tr>" +
        "<td class='head'>Port No.</td>" +
        "<td class='info'>" + object.zport + "</td>" +
        "</tr>" +
        "<tr>" +
        "<td class='head'>Subnet Mask</td>" +
        "<td class='info'>" + object.zSubnet + "</td>" +
        "</tr>" +
        "</tbody>" +
        "</table>" +
        
       
    /*"</div>"+
    "<div style='height:8px;'>" +
    "<div></div>" +*/
        "</div>";
    else if (object.type == 'Sensor')
        info = "<div class='outerDivSensor'>" +
        "<div class='tableDiv'>" +
        "<table class = 'tblSkyBlue'>" +
        "<thead>" +
        "<tr>" +
        "<th colspan =\"2\"class='title'>Sensor Details</th>" +
        "</tr>" +
        "</thead>" +
        "<tbody>" +
        "<tr>" +
        "<td class='head'>Sensor Name</td>" +
        "<td class='info'>" + object.sn + "</td>" +
        "</tr>" +
        "<tr>" +
        "<td class='head'>Sensor Alias</td>" +
        "<td class='info'>" + object.sAlias + "</td>" +
        "</tr>" +
        "<tr>" +
        "<td class='head'>Zone Alias</td>" +
        "<td class='info'>" + object.sGroup + "</td>" +
        "</tr>" +
        "<tr>" +
        "<td class='head'>Sampling Rate</td>" +
        "<td class='info'>" + object.sRate + "</td>" +
        "</tr>" +
        "<tr>" +
        "<td class='head'>Sensitivity</td>" +
        "<td class='info'>" + object.sSensit + "</td>" +
        "</tr>" +
        "<tr>" +
        "<td class='head'>Threshold value</td>" +
        "<td class='info'>" + object.tValue + "</td>" +
        "</tr>" +        
        "</tbody>" +
        "</table>" +
        "<div class='infoWindowFoot'>" +
        "<div class='cameraImage yoButtons' onclick = 'javascript:deviceClickCallback(\"sensor\",\"" + object.sId + "\",\"" + object.sAlias + "\");'><span class='cursorPointer'><img  style='margin-right:3px;' src='" + imagesPath + "heart-beat-icon1.png' /></span>Draw Heartbeat</div>" +
        //"<div class='cameraImage yoButtons'><span class='cursorPointer'><img style='margin-right:3px; margin-top:-1px;' src='" + imagesPath + "settings.png' /></span>Configure</div>"

    //"<div class='cameraImage yoButtons' onclick = 'showHeartBeat(\"" + object.sId + "\")'>" +
    //"<div class='cameraImage' title='Delete Sensor' onclick = 'deleteSensor(\"" + object.sId + "\")'>" +
    //"<span class='sensorImage' title='Delete Sensor' onclick = 'deleteSensor(\"" + object.sId + "\")'>"+
    //"<img src ='" + imagesPath + "Delete_2_28.png'  title='Delete Sensor' onclick = 'deleteSensor(\"" + object.sId + "\")'>" +
        "</div>" +
        "</div></div>";
    //Calling function attach infowindow to marker
    this.attachInfo(marker, info, mpos);
    return marker;
}
//-----------------------------------------------------------
//Function to bind info window to a marker
pfMap.prototype.attachInfo = function (marker, info, mp) {
    //console.log(info);
    var myInfoWindow = new OpenLayers.Popup.FramedCloud(
        "User",
        mp,
        null,
        info,
        null,
        true
        );
    marker.info = myInfoWindow;
    this.map.addPopup(myInfoWindow);
    myInfoWindow.imageSize.w = 1260;
    myInfoWindow.hide();
    //registering click event on marker
    marker.events.register('click', marker, function (event) {
        if (lastInfoOpen != null)
            lastInfoOpen.hide();
        myInfoWindow.updateSize();
        // document.getElementById("User_contentDiv").style.height = "auto";
        //document.getElementById("User_contentDiv").style.width = "auto";
        myInfoWindow.show();
        lastInfoOpen = myInfoWindow;
    });
}
//Function to add camera on map
pfMap.prototype.addCameraMarker = function (size, camera) {
    //defining offset of marker icon
    var mpos = new OpenLayers.LonLat(camera.lg, camera.lt);
    if (camera.img != null)
        var img = imagesPath + camera.img;
    else
        img = imagesPath + "newCameraUp.png";
    var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
    var icon = new OpenLayers.Icon(img, size, offset);
    marker = new OpenLayers.Marker(mpos, icon);
    marker.type = 'camera';
    //Adding current marker to markers array
    this.cmarkers.addMarker(marker);
    var ptz = camera.Ptz == true ? 'Yes' : 'No'
    var info = "<div class='outerDivCamera'>" +
    "<div class='tableDiv'>" +
    "<table class = 'tblSkyBlue'>" +
    "<thead>" +
    "<tr>" +
    "<th colspan =\"2\"class='title'>Camera Details </th>" +
    "</thead>" +
    "<tbody>" +
    "<tr>" +
    "<td class='head'>Name</td>" +
    "<td class='info'>" + camera.cId + "</td>" +
    "</tr>" +
    "<tr>" +
    "<td class='head'>IP Address</td>" +
    "<td class='info'>" + camera.cDesc + "</td>" +
    "</tr>" +
    "<tr>" +
    "<td class='head'>Support PTZ</td>" +
    "<td class='info'>" + ptz + "</td>" +
    "</tr>" +
    "<tr>" +
    "</table>" +
    "<div class='infoWindowFoot'>" +
    //"<div class='cameraImage yoButtons' onclick = 'cameraLiveFeed(\"" + (camera.cId) + "\")'><span class='cursorPointer'><img  style='margin:-1px 3px; 0 0' src='" + imagesPath + "monitor-window.png' /></span>Show Live Feed</div>" +
    "<div class='cameraImage yoButtons' onclick = 'javascript:deviceClickCallback(\"camera\",\"" + camera.cId + "\");'><span class='cursorPointer'><img  style='margin:-1px 3px; 0 0' src='" + imagesPath + "monitor-window.png' /></span>Live Feed</div>";
    //"<div class='cameraImage yoButtons'><span class='cursorPointer'><img  style='margin:-1px 3px; 0 0' src='" + imagesPath + "settings_blue.png' /></span>Configure</div>";

    // console.log(camera.Ptz);

    /* if (camera.Ptz == true) {
    console.log('adding');
    info += "<div class='cameraImage yoButtons' onclick = 'javascript:deviceClickCallback(\"camera\",\"" + camera.cId + "\");'>PTZ</div>";
    }*/
    //"<div class='cameraImage' title='Delete camera' onclick = 'deleteCamera(\"" + (camera.cId) + "\")'>" +    
    // "</div>" +
    //"<span  title='Camera LiveFeed' onclick = 'cameraLiveFeed(" + camera.cId + ")'></span><span class='cameraImage' title='Delete camera' onclick = 'deleteCamera(" + camera.cId +     ")'></span>"+
    //<img src = '" + imagesPath + "live-feed_2_28.png' title='Camera LiveFeed' onclick = 'cameraLiveFeed(" + camera.cId + ")'> <img src = '" + imagesPath + 																							     //"Delete_2_28.png' title='Delete camera' onclick = 'deleteCamera(" + camera.cId + ")'></td>" +
    //"<div class='sensorImage'  title=' Camera LiveFeed' onclick = 'cameraLiveFeed(\"" + camera.cId + "\")'>" +
    //"</div>" +
    info += "</div></div>" +
    "</div>";
    this.attachInfo(marker, info, mpos);
    return marker;
}
//Function to show sensor that create alarm
pfMap.prototype.sensoralert = function (sensorOption) {
    //this.resetMap();
    //console.dir(sensorOption);
    for (i in sensorOption) {
        for (j in this.sensors) {
            if (sensorOption[i].sId == this.sensors[j].id) {
                //console.log("alias : " + sensorOption[i].sId + " , isalarm : " + sensorOption[i].IsAlarm);
                var img;
                if (sensorOption[i].IsAlarm == 0) {
                    if (sensorOption[i].img != null) {
                        img = imagesPath + sensorOption[i].img;
                    }
                    else {
                        img = imagesPath + "sensor1.png";
                    }
                    //img = "/Content/images/sensor1.png";
                }

                else if (sensorOption[i].IsAlarm == 1) {
                    if (sensorOption[i].img != null) {
                        var imageName = sensorOption[i].img.split(".");
                        img = imagesPath + imageName[0] + "_alert.gif";
                    }
                    else {
                        img = imagesPath + "sensor1_alert.gif";
                    }
                    //img = "/Content/images/sensor1_alert.gif";
                }
                if (lastHighlightedSensor == null || sensorOption[i].sId != lastHighlightedSensor.alias || sensorOption[i].IsAlarm != this.sensors[j].isAlarm)
                    this.sensors[j].setUrl(img);
                this.sensors[j].isAlarm = sensorOption[i].IsAlarm;
            }
        }
    }
}
//Function to draw range of camera on map
pfMap.prototype.drawRange = function (rangeOptions) {
    for (s in rangeOptions) {
        for (k in this.camera) {
            if (this.camera[k].id == rangeOptions[s].cameraId) {
                var i = 0, points = new Array(), b = rangeOptions[s].startAngle * Math.PI / 180, a = rangeOptions[s].startAngle;
                var dif = b - a;
                while (a < rangeOptions[s].endAngle) {
                    var lat1 = rangeOptions[s].centerLatitude;
                    var lon1 = rangeOptions[s].centerLongitude;
                    var R = 0;
                    var d = rangeOptions[s].radius;
                    lat = lat1 + d * Math.cos(a * Math.PI / 180);
                    lon = lon1 + d * Math.sin(a * Math.PI / 180);
                    i++;
                    a = a + 0.5;
                    points[i] = new OpenLayers.Geometry.Point(lat, lon);

                }
                ////creating an instance of OpenLayers.Geometry.LineString class
                var lineArray = new Array();
                for (j in points) {
                    lineArray[j] = new OpenLayers.Geometry.LineString([new OpenLayers.Geometry.Point(rangeOptions[s].centerLatitude, rangeOptions[s].centerLongitude), points[j]])
                }
                var line = new OpenLayers.Geometry.MultiLineString(lineArray);
                //instantiaing OpenLayers.Feature.Vector class
                var vectorRange = new OpenLayers.Feature.Vector(line, {}, {
                    strokeColor: rangeOptions[s].color,
                    strokeOpacity: 0.1,
                    strokeWidth: 1
                });
                this.camera[k].range = vectorRange;
            }
        }
    }
}
//Function to hide range of camera	
pfMap.prototype.hideRange = function () {
    for (i in this.camera) {
        this.vlayer.removeFeatures([this.camera[i].range]);
    }
}
//Function to show range of camera
pfMap.prototype.showRange = function () {
    for (i in this.camera) {////alert(this.camera[i].range);
        this.vlayer.addFeatures([this.camera[i].range]);
    }
}
//Function to hide camera on map
pfMap.prototype.hideCamera = function () {
    for (i in this.camera) {
        this.cmarkers.removeMarker(this.camera[i].s1);
        this.camera[i].s1.info.hide();
        //this.cmarkers.removeMarker(this.camera[i].s2);
        //this.cmarkers.removeMarker(this.camera[i].s3);
    }
    hideCameraFlag = true;
}
//Function to show camera on map
pfMap.prototype.showCamera = function () {
    for (var i in this.camera)
        this.cmarkers.addMarker(this.camera[i].s1);
    hideCameraFlag = false;
}
//Function to reset the map that make all zones and sensors in intial state
pfMap.prototype.resetMap = function () {
    for (i in this.myAlarm) {
        myDiv.removeChild(this.myAlarm[i]);
    }
    for (i in this.zones) {
        //document.body.removeChild(this.zones[i].toolTip);
    }
    for (i in this.sensors) {
        //document.body.removeChild(this.sensors[i].toolTip);
    }
    this.myAlarm = new Array();
    this.map.removeLayer(this.markers);
    //this.map.removeLayer(this.vlayer);
    this.markers = new OpenLayers.Layer.Markers("Markers");
    this.map.addLayer(this.markers);
    this.zc = 0;
    this.sc = 0;
    //code to add zones to map
    for (i in this.myZones) {
        this.myZones[i].type = 'Zone';
        var m = this.addMarker(new OpenLayers.Size(20, 20), this.myZones[i]);
        m.id = this.myZones[i].zId;
        this.zones[this.zc] = m;
        this.zc++;
    }
    //code to add sensors to map	
    for (i in this.mySensors) {
        this.mySensors[i].type = 'Sensor';
        var m = this.addMarker(new OpenLayers.Size(100, 100), this.mySensors[i]);
        //var m=this.addMarker(new OpenLayers.Size(100,100),this.mySensors[i].sDesc,new OpenLayers.LonLat(this.mySensors[i].lt,this.mySensors[i].lg),this.mySensors[i].img);
        m.id = this.mySensors[i].sId;
        m.isAlarm = this.mySensors[i].IsAlarm;
        m.alias = this.mySensors[i].sAlias;
        m.sn = this.mySensors[i].sn;
        m.img = this.mySensors[i].img;
        this.sensors[this.sc] = m;
        this.sc++;
    }
    this.lineAlert(this.lineOptions);
}
//this function is called when we click on to the liveFeed button of the camera infoWindow.
function cameraLiveFeed(camId) {
    viewCamLiveFeed(camId);
}
//function to delete the sensor
pfMap.prototype.deleteSensor = function (sensor) {
    if (isAlarm == 1) {
        alert("Can not delete sensor,Sensor is Active");
    }
    else {
        for (i in this.mySensors) {
            if (this.mySensors[i].sId == sensor.sId) {
                this.markers.removeMarker(sensor);
            }
        }
    }
}
//function to delete the sensor
function deleteSensor(id) {
    var confermation = tempMap.produceAlert();
    if (confermation == true) {
        for (var i in tempMap.sensors) {
            if (tempMap.sensors[i].id == id) {
                if (tempMap.sensors[i].isAlarm == 0) {
                    tempMap.markers.removeMarker(tempMap.sensors[i]);
                    lastInfoOpen.hide();
                    deleteObjectFromDB(id);
                }
                else {
                    alert("Can not delete active Sensor");
                }
            }
        }
    }
    else
        return;
}
//function to remove the camera
function deleteCamera(id) {
    var confermation = tempMap.produceAlert();
    if (confermation == true) {
        for (var i in tempMap.camera) {
            if (tempMap.camera[i].s1.id == id) {
                tempMap.cmarkers.removeMarker(tempMap.camera[i].s1);
                deleteObjectFromDB(id);
            }
            lastInfoOpen.hide();
        }
    }
    else
        return;
}
//this function will produce alert whenever the user wants to delete the camera or sensor that will give the surety that delete it
pfMap.prototype.produceAlert = function () {
    return confirm("Are you sure you want to delete element.")
}
pfMap.prototype.hideSensors = function () {
    for (var i in this.sensors) {
        this.markers.removeMarker(this.sensors[i])
        this.sensors[i].info.hide();
    }
    //alert("sensors hide");
    hideSensorFlag = true;
    this.blockLineAlerts();
}
pfMap.prototype.showSensors = function () {
    for (var i in this.sensors) {
        this.markers.addMarker(this.sensors[i])
    }
    hideSensorFlag = false;
    //alert("sensors show");
    this.displayLineAlerts();
}
pfMap.prototype.hideZones = function () {
    for (var i in this.zones) {
        this.markers.removeMarker(this.zones[i])
        this.zones[i].info.hide();
    }
    hideZoneFlag = true;
}
pfMap.prototype.showZones = function () {
    for (var i in this.zones) {
        this.markers.addMarker(this.zones[i])
    }
    hideZoneFlag = false;
}
//this function will draw the alert between sensors on which we got the alarm
pfMap.prototype.lineAlert = function (lineOptions) {
    //console.dir(lineOptions);
    this.removeLineAlerts();
    if (hideFlag != null)
        clearInterval(hideFlag);
    for (var i in lineOptions) {
        var points = new Array();
        for (var j in lineOptions[i]) {
            /*
            if (typeof ('console') != 'undefined' && showLog == 1)            
            console.log(lineOptions[i]);
            -*/
            points.push(new OpenLayers.Geometry.Point(lineOptions[i][j].x, lineOptions[i][j].y));
            var line = new OpenLayers.Geometry.LineString(points);
            var vector = new OpenLayers.Feature.Vector(line, {}, {
                strokeColor: '#FF3399',
                strokeOpacity: 1,
                strokeWidth: 5
            });
        }
        if (checkSensoronMap != false) {
            this.lineAlertLayer.addFeatures([vector]);
        }
        this.lineAlerts.push(vector);
    }
    if (checkSensoronMap != false)
        hideFlag = setInterval("tempMap.hideLineAlerts()", 1000)
}
//this function will remove the lines on which we have alerts
pfMap.prototype.removeLineAlerts = function () {
    clearInterval(hideFlag);
    clearInterval(showFlag);
    for (var i in this.lineAlerts) {
        this.lineAlertLayer.removeFeatures([this.lineAlerts[i]]);
    }
    this.lineAlerts = [];
}
//this function is used to show  the line  that will show all the alert lines 
pfMap.prototype.showLineAlerts = function () {
      for (var i in this.lineAlerts) {
    this.lineAlertLayer.addFeatures([this.lineAlerts[i]]);
    }
    //this.lineAlertLayer.setVisibility(true);
    clearInterval(showFlag);
}
//this function is used to hide all the lines that are showing the alert
pfMap.prototype.hideLineAlerts = function () {
    for (var i in this.lineAlerts) {
    this.lineAlertLayer.removeFeatures([this.lineAlerts[i]]);
    }
    //this.lineAlertLayer.setVisibility(false);
    showFlag = setInterval("tempMap.showLineAlerts()", 500);
}
//this function will remove the lines on which we have alerts
pfMap.prototype.blockLineAlerts = function () {
    clearInterval(hideFlag);
    clearInterval(showFlag);
    checkSensoronMap = false;
    //alert("in");
    this.lineAlertLayer.setVisibility(false);
}
//this function is used to show  the line  that will show all the alert lines
pfMap.prototype.displayLineAlerts = function () {
    checkSensoronMap = true;
    this.lineAlertLayer.setVisibility(true);
    //alert("out");
    hideFlag = setInterval("tempMap.hideLineAlerts()", 1000);
}
//this function will use to select the sensor on to the map
pfMap.prototype.showSelectedSensor = function (sid) {
    this.removeSelectedSensor();        
    for (var i in sid) {
        for (var j in this.sensors) {
            if (this.sensors[j].id == sid[i]) {
                if (this.sensors[j].isAlarm == 1)
                    var imageName = this.sensors[j].icon.url.split("_alert");
                if (this.sensors[j].isAlarm == 0)
                    var imageName = this.sensors[j].icon.url.split(".");
                /*lastHighlightedSensor = {
                "alias": sid[i],
                "path": this.sensors[j].icon.url
                }*/
                lastHighlightedSensor = {
                    "alias": sid[i],
                    "path": imageName[0]
                }
                // If sensor is alarming and not already in the state of Highlight.
                if (imageName.length > 1) {
                    if (this.sensors[j].isAlarm == 1)
                        var img = imageName[0] + "_alert_highlight.gif";
                    if (this.sensors[j].isAlarm == 0)
                        var img = imageName[0] + "_highlight.png";
                    checkHighlightedSensor = true;
                    this.sensors[j].setUrl(img);
                    this.openInfoWindow(this.sensors[j]);
                }
            }
        }
    }
}
//this function will remove the highligted sensor and will restore the previous sensor
pfMap.prototype.removeSelectedSensor = function () {
    if (checkHighlightedSensor == true) {
        $('.active-alarm-row').removeClass('active');
        for (var j in this.sensors) {            
            if (lastHighlightedSensor != null) {
                if (this.sensors[j].id == lastHighlightedSensor.alias) {
                    if (this.sensors[j].isAlarm == 1) {
                        this.sensors[j].setUrl(lastHighlightedSensor.path + "_alert.gif");
                        checkHighlightedSensor = false;
                        lastHighlightedSensor = null;
                        this.sensors[j].info.hide();
                    }

                    else {
                        this.sensors[j].setUrl(lastHighlightedSensor.path + ".png");
                        checkHighlightedSensor = false;
                        lastHighlightedSensor = null;
                        this.sensors[j].info.hide();
                    }
                }
            }
        }
    }
}
//this function will add the alert on to the sesor
/*
pfMap.prototype.addAlertOnSensor = function (sensorOptions) {
    for (var i in sensorOptions) {
        for (var j in this.sensors) {            
            if (sensorOptions[i].sId == this.sensors[j].id) {                
                var img;
                if (sensorOptions[i].img != null) {
                    var imageName = sensorOptions[i].img.split(".");
                    img = imagesPath + imageName[0] + "_alert.gif";
                }
                else {
                    img = imagesPath + "sensor1_alert.gif";
                }
                this.sensors[j].setUrl(img);
                this.sensors[j].isAlarm = true;
            }
        }
    }
}*/
//this function will add the alert on to the sesor
/*
pfMap.prototype.removeAlertOnSensor = function (sensorOptions) {
    for (var i in sensorOptions) {
        for (var j in this.sensors) {

            if (sensorOptions[i].alias == this.sensors[j].alias) {
                var img;
                if (sensorOptions[i].img != null) {
                    img = imagesPath + sensorOptions[i].img;
                }
                else {
                    img = imagesPath + "sensor1.png";
                }
                this.sensors[j].setUrl(img);
                this.sensors[j].isAlarm = false;
            }
        }
    }
}
*/

/*
* Callback funciton on map device click.
*/
function deviceClickCallback(type, id, alias) {
	tempMap.devceClikCallback(type, id, alias);
}
/*----------function to change the camera------------*/
pfMap.prototype.changeCameraImg = function (options) {
 /*   for (var i in this.camera) {
        if (this.camera[i].s1.id == options.id) {
            if (options.isOn == 1) {
                var img = this.camera[i].s1.img.split(".");
                this.camera[i].s1.setUrl(imagesPath + img[0] + "_on.gif");
                this.camera[i].s2.setUrl(imagesPath + img[0] + "_on.gif");
                this.camera[i].s3.setUrl(imagesPath + img[0] + "_on.gif");
            }
            if (options.isOn == 0) {
                this.camera[i].s1.setUrl(imagesPath + this.camera[i].s1.img);
                this.camera[i].s2.setUrl(imagesPath + this.camera[i].s2.img);
                this.camera[i].s3.setUrl(imagesPath + this.camera[i].s3.img);
            }
        }
    }*/
}
//this function will change the nultiple camera images
pfMap.prototype.changeMultipleCameraImg = function (optionsArray) {
   /*for (i in optionsArray) {
        this.changeCameraImg(optionsArray[i]);
    }*/
}
//--------------------------------------------------------------
//right click menu of the map
pfMap.prototype.contextMenu = function (mapDiv, options) {
    //console.log(options);
    var menu = document.createElement("div");
    menu.setAttribute("id", "menu");
    menu.setAttribute("class", "menucss");
    menu.style.zIndex = 9999;
    menu.style.display = 'none';
    var htmlString = "<ul>";
    for (var i in options) {
        htmlString += "<li  onclick ='" + options[i].menuFunction + "'><span><img src='" + imagesPath + options[i].imgName + "'></span><label>" + options[i].menuName + "</label></li>";
    }
    htmlString += "</ul>";
    menu.innerHTML = htmlString;
    mapDiv.appendChild(menu);
}
//binding the menue on to the map to open at right click event
pfMap.prototype.bindcontextMenu = function () {
    this.map.events.register('mouseup', this, function (e) {
        if (OpenLayers.Event.isRightClick(e)) {
            var postionNew = e.xy;
            window.eventToPlaceElement = e;
            if (checkHighlightedSensor == false) {
                $("#menu").find("ul li:first").css({
                    "opacity": 0.5
                });
            }
            else {
                $("#menu").find("ul li:first").css({
                    "opacity": 1
                });
            }
            if (this.mapContainer.width() < $("#menu").width() + e.xy.x) {
                if (this.mapContainer.height() < $("#menu").height() + e.xy.y)
                    $("#menu").css({
                        top: e.xy.y - 100,
                        left: e.xy.x - 170,
                        display: 'block'
                    });
                else
                    $("#menu").css({
                        top: e.xy.y - 3,
                        left: e.xy.x - 170,
                        display: 'block'
                    });
            } else {
                if (this.mapContainer.height() < $("#menu").height() + e.xy.y)
                    $("#menu").css({
                        top: e.xy.y - 100,
                        left: e.xy.x - 3,
                        display: 'block'
                    });
                else
                    $("#menu").css({
                        top: e.xy.y - 3,
                        left: e.xy.x - 3,
                        display: 'block'
                    });
            }

            /*$("#menu").mouseout(function (e) {
            $(this).css({ display: 'none' });
            });*/
            $("body").click(function (e) {
                $("#menu").css({
                    display: 'none'
                });
            });
            $("#menu").click(function (e) {
                e.stopPropagation();
            });
            $("#menu").find("ul").mouseover(function (e) {
                $("#menu").css({
                    display: 'block'
                });
            });
            $("#menu").find("ul li").click(function (e) {
                $("#menu").css({
                    display: 'none'
                });
            });
            if (checkHighlightedSensor == false) {
                $("#menu").find("ul li:not:first").click(function (e) {
                    $("#menu").css({
                        display: 'block'
                    });
                });
            }
            else {

            }

        }
    });
}
//this function will move the map to the postion we have clicked
pfMap.prototype.setCenterOnClick = function (e) {
    var possition = this.map.getLonLatFromPixel(new OpenLayers.Pixel((e.clientX - this.mapContainer.offset().left), (e.clientY - this.mapContainer.offset().top)));
    //this.map.map.panTo(possition);
    this.map.setCenter(possition);
    //this.map.moveTo(tempMap.map.getCenter());
}
//zoom in the map
pfMap.prototype.zoomInMap = function () {
    this.map.zoomIn();
}
//zoom out of the map
pfMap.prototype.zoomOutMap = function () {
    this.map.zoomOut();
}
//this function will be called when we need to open the infowindow of the objects(sensor,camera,zone)
pfMap.prototype.openInfoWindow = function (marker) {
    if (lastInfoOpen != null)
        lastInfoOpen.hide();
    if (marker.type == 'Sensor' && hideSensorFlag == true) {
        return;
    }
    if (marker.type == 'Zone' && hideZoneFlag == true) {
        return;
    }
    if (marker.type == 'camera' && hideCameraFlag == true) {
        return;
    }
    marker.info.show();
    // marker.info.updateSize();
    lastInfoOpen = marker.info;
    marker.info.updateSize();
}
//this function will update the map size acording to the div size
pfMap.prototype.chnageMapSize = function () {
    tempMap.map.updateSize();
}
//wiil resset all the flags 
pfMap.prototype.resetMapFlasg = function () {
    hideSensorFlag = false;
    hideZoneFlag = false;
    hideCameraFlag = false;
    checkHighlightedSensor = false;
    lastInfoOpen = null;
    tempMap = null;

    lastHighlightedSensor = null;
    checkSensoronMap = true;

    this.removeLineAlerts();
    this.lineAlerts = [];
    //console.log(this.lineAlerts);
    hideFlag = null;
    showFlag = null;

}
