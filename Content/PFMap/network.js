var popupLeft = null;
PerimeterFence.prototype.constructor = PerimeterFence;

$(window).load(function () {
    PerimeterFence();
});

//this function is called on body load
function PerimeterFence() {
  
    //instance reference variable that hold object of OpenLayers.Bounds class representing map bounds
    this.bound = null;
    //instance reference variable that hold object of OpenLayers.Map class 
    this.mymap = null;
    //creating the instance for geoservermap layer
    this.mapLayer = null;
    //creating the instance for vector layer
    this.vectorsLayer = null;
    //creating the instance for vsius layer
    this.vsiusLayer = null;
    //creating the instance for markers layer
    this.markersLayer = null;
    //maintaining the number of vsiu added and assigning unique id to each in VSIULayer
    this.counterVSIU = 0;
    this.counterVector = 0;
    //counter to check how many times lineConnect function has been called
    this.calledFunctionNoTimes = 0;
    //check counter for connect network
    this.counterConnect = 0;
    //variable used in drag marker function and popupon rightclickvector function
    this.positionNew = 0;
    //getting the position of the all end markers
    this.positionsArray = [];
    //to hold all the children markers of a network excluding corner markers
    this.markersArrayChildren = [];
    //maintaining the number of marker added and assigning unique id to each in MarkerLayer
    this.counterMarker = 0;
    //creating array for markers
    this.markersArray = new Array();
    //creating array for VSIUs
    this.vsiusArray = new Array();
    //creating array for vectors
    this.vectorsArray = new Array();
    //creating array for left popups
    this.leftPopupVsiuArray = new Array();
    //creating array for right popups
    this.rightPopupVsiuArray = new Array();
    //creating the map bounds
    this.bound = new OpenLayers.Bounds(0, 0, 1550, 480);
    //creating line style for vectors
    this.style_red =
     {
         strokeColor: "#00ff00",
         strokeOpacity: 1,
         strokeWidth: 2,
         fillColor: "#00000",
         fillOpacity: 0
     };
    this.style_green =
     {
         strokeColor: "#00ff00",
         strokeOpacity: 1,
         strokeWidth: 2,
         fillColor: "#00000",
         fillOpacity: 0
     };

    //Creating an instance of map
    this.mymap = new OpenLayers.Map("mapContainer", {
        maxExtent: this.bound,
        maxResolution: 1.15,
        projection: "EPSG:4326",
        units: 'degrees'
    });

    //creating layer for WMS 					
    this.mapLayer = new OpenLayers.Layer.WMS("map", "http://i.codescape.in:887/geoserver/wms", { layers: "org_map" }, { 'isBaseLayer': true }, { 'displayInLayerSwitcher': true });
    //adding WMS layer to map
    this.mymap.addLayer(this.mapLayer);
    //setting the center of map
    this.mymap.setCenter(new OpenLayers.LonLat(875, 225));
    //creating the vector layer
    this.vectorsLayer = new OpenLayers.Layer.Vector("Vectors");
    //creating id for vector layer
    this.vectorsLayer.id = "VECTOR";
    //creating the VSIU layer
    this.vsiusLayer = new OpenLayers.Layer.Markers("Vsius");
    //creating id for VSIU layer
    this.vsiusLayer.id = "VSIU";
    //creating the markers layer
    this.markersLayer = new OpenLayers.Layer.Markers("Markers");
    //creating id for markers layer
    this.markersLayer.id = "MARKER";
    //adding the VSIUlayer to map
    this.mymap.addLayer(this.vsiusLayer);
    //adding the vector layer to map
    this.mymap.addLayer(this.vectorsLayer);
    //adding markers layer to map
    this.mymap.addLayer(this.markersLayer);
    //attaching drag to the vsiu
    attachDrag(document.getElementById('vsiu'));

}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////

//this function is used to associate the drag event for the VSIU
function attachDrag(element) {
    var handler = DragHandler.attach(element);
    handler.dragEnd = findAndMark;
    //return handler;
}

var newdiv;
var startx;
var starty;

var DragHandler = {
    // private property.
    _oElem: null,
    // public method. Attach drag handler to an element.
    attach: function (oElem) {
        oElem.onmousedown = DragHandler._dragBegin;
        // callbacks
        oElem.dragEnd = new Function();
        return oElem;
    }, //closing the attach
    // private method. Begin drag process.
    _dragBegin: function (e) {
        var oElem = DragHandler._oElem = this;
        if (isNaN(parseInt(oElem.style.left))) { oElem.style.left = '0px'; }
        if (isNaN(parseInt(oElem.style.top))) { oElem.style.top = '0px'; }
        var x = startx = parseInt(oElem.style.left);
        var y = starty = parseInt(oElem.style.top);
        e = e ? e : window.event;
        oElem.mouseX = e.clientX;
        oElem.mouseY = e.clientY;
        document.onmousemove = DragHandler._drag;
        document.onmouseup = DragHandler._dragEnd;
        return false;
    }, //closing the dragbegin
    // private method. Drag (move) element.
    _drag: function (e) {
        var oElem = DragHandler._oElem;
        var x = parseInt(oElem.style.left);
        var y = parseInt(oElem.style.top);
        e = e ? e : window.event;
        oElem.style.left = x + (e.clientX - oElem.mouseX) + 'px';
        oElem.style.top = y + (e.clientY - oElem.mouseY) + 'px';
        oElem.mouseX = e.clientX;
        oElem.mouseY = e.clientY;
        return false;
    }, //closing the drag
    // private method. Stop drag process.
    _dragEnd: function () {
        var oElem = DragHandler._oElem;
        var x = parseInt(oElem.style.left);
        var y = parseInt(oElem.style.top);
        oElem.style.left = startx + 'px';
        oElem.style.top = starty + 'px';
        document.onmousemove = null;
        document.onmouseup = null;
        DragHandler._oElem = null;
        oElem.dragEnd(oElem, x, y);
    } //closing the dragend
}//closing the DragHandler


///////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////


//this function is called on drag end and is used to create the draggable object on map
function findAndMark(element, x, y) {
    //checking which element has been dragged on map
    //for vsiu element
    if (element.id == 'vsiu') {
        //getting the position of the vsiu 
        var positionVSIU = mymap.getLonLatFromPixel(new OpenLayers.Pixel(x + 1100, y + 40));
        //getting the size of the marker
        var sizeVSIU = new OpenLayers.Size(50, 50);
        //getting the start poition of marker
        var offsetVSIU = new OpenLayers.Pixel(-(sizeVSIU.w / 2), -sizeVSIU.h);
        //getting the image for marker
        var iconVSIU = new OpenLayers.Icon('/content/PFMAP/IMG/vsiu.png', sizeVSIU, offsetVSIU);
        //getting a marker at the position with the image
        var VSIUadded = new OpenLayers.Marker(positionVSIU, iconVSIU);

        //assigning unique id to each vsiu 
        VSIUadded.id = counterVSIU;

        //adding the vsiu object to the vsiu array
        /* vsiusArray.push(VSIUadded);
        //adding the marker to the VSIULayer layer
        */

        vsiusLayer.addMarker(VSIUadded);

        //creating unique form for the popup content
        idNew = "form" + counterVSIU;

        //creating the list on left click for vsiu
        var leftList = '<html><body><form id=' + idNew + ' >Latitude: <input type="text"  name="latitude" />' +
  '<br />Longitude: <input type="text" name="longitude"  /><br />' +
  '<input type="submit" value="Submit" /></form></body></html>';

        //creating the list on right click for vsiu
        var rightList = '<html><body><table><tr><td><b>VSIU</b></td></tr><tr><td>Edit</td></tr><tr><td>Delete</td></tr></table></body></html>';
        //creating the popup with the list for left click
        var popupLeft = new OpenLayers.Popup(
             null,
			 positionVSIU,
                   new OpenLayers.Size(150, 150),
                   leftList,
                   true);

        //creating the popup with the list for rightclick
        var popupRight = new OpenLayers.Popup(
             null,
			 positionVSIU,
                   new OpenLayers.Size(60, 80),
                   rightList,
                   true);
        /*	popupLeft.id=counterVSIU;
        popupRight.id=counterVSIU;
        */
        leftPopupVsiuArray.push(popupLeft);
        rightPopupVsiuArray.push(popupRight);

        //adding the leftlist popup to the map for the vsiu
        mymap.addPopup(popupLeft);
        //adding the rightlist popup to the map for the vsiu
        mymap.addPopup(popupRight);
        //hiding the right list popup for vsiu at begin
        popupRight.hide();
        //hiding the left list popup for vsiu at begin
        popupLeft.hide();
        var form = document.getElementById(idNew);
        form.latitude.value = VSIUadded.lonlat.lat;
        form.longitude.value = VSIUadded.lonlat.lon;

        //updating the number of vsiu added
        // counterVSIU=counterVSIU+1;
        //registering the click event for the vsiu added
        VSIUadded.events.register("mousedown", VSIUadded, function (e) {
            $("#mapContainer").bind("contextmenu", function (event) {
                event.preventDefault();
            });
            //Check is right button clicked 
            if (OpenLayers.Event.isRightClick(e)) {

                rightPopupVsiuArray[parseInt(VSIUadded.id)].show();
            }
            else
            // Check is Left button clicked 
                if (OpenLayers.Event.isLeftClick(e)) {
                    leftPopupVsiuArray[parseInt(VSIUadded.id)].show();
                }
        });
        counterVSIU = counterVSIU + 1;
        //creating lines for vsiu on both ends
        DrawDefaultLineVSIU(VSIUadded);

    } // closing the if condition for vsiu
} //closing the findAndMark



///////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////
//this method creates lines on both ends to vsiu with markers at each end
function DrawDefaultLineVSIU(elementVSIU) {


    //create Right side line to the dragable object marker1
    var pointsLineRight = [];
    var pointsLineLeft = [];
    /*
    setting the properties for marker
    */
    //getting the size of the marker
    sizeMarker = new OpenLayers.Size(30, 30);
    //getting the start poition of marker
    offsetMarker = new OpenLayers.Pixel(-(sizeMarker.w / 2), -sizeMarker.h);
    //getting the image for marker
    iconMarker = new OpenLayers.Icon('content/PFMAP/IMG/blueMarker.png', sizeMarker, offsetMarker);

    //create Right side line to the dragable object marker1
    var pointStartRight = new OpenLayers.Geometry.Point(elementVSIU.lonlat.lon, elementVSIU.lonlat.lat);
    var pointEndRight = new OpenLayers.Geometry.Point(elementVSIU.lonlat.lon + 20, elementVSIU.lonlat.lat);
    pointsLineRight.push(pointStartRight);
    pointsLineRight.push(pointEndRight);

    //create Left side line to the dragable object marker1

    var pointStartLeft = new OpenLayers.Geometry.Point(elementVSIU.lonlat.lon, elementVSIU.lonlat.lat);
    var pointEndLeft = new OpenLayers.Geometry.Point(elementVSIU.lonlat.lon - 20, elementVSIU.lonlat.lat);
    pointsLineLeft.push(pointStartLeft);
    pointsLineLeft.push(pointEndLeft);


    // adding the vectors to the vector layer
    var lineRightVSIU = new OpenLayers.Geometry.LineString(pointsLineRight);
    var lineLeftVSIU = new OpenLayers.Geometry.LineString(pointsLineLeft);
    var vectorRightVSIU = new OpenLayers.Feature.Vector(lineRightVSIU, null, style_red);
    //	vectorRightVSIU.fid=++counterVector+"";
    var vectorLeftVSIU = new OpenLayers.Feature.Vector(lineLeftVSIU, null, style_red);
    //  vectorLeftVSIU.fid=++counterVector+"";
    vectorsLayer.addFeatures([vectorRightVSIU, vectorLeftVSIU]);
    vectorsLayer.style = style_red;
    //adding the markers to the markers layer
    var RightMarkerVsiuPosition = new OpenLayers.LonLat(elementVSIU.lonlat.lon + 20, elementVSIU.lonlat.lat);
    var LeftMarkerVsiuPosition = new OpenLayers.LonLat(elementVSIU.lonlat.lon - 20, elementVSIU.lonlat.lat);
    var markerAddedLeftVSIU = new OpenLayers.Marker(LeftMarkerVsiuPosition, iconMarker);
    //	markerAddedLeftVSIU.id=counterMarker++;
    var markerAddedRightVSIU = new OpenLayers.Marker(RightMarkerVsiuPosition, iconMarker.clone());
    //   markerAddedRightVSIU.id=counterMarker++;
    markersLayer.addMarker(markerAddedLeftVSIU);
    markersLayer.addMarker(markerAddedRightVSIU);

    //creating the association for vsiu and the markers
    elementVSIU.child = [markerAddedLeftVSIU, markerAddedRightVSIU];
    elementVSIU.pline = null;
    elementVSIU.parent = null;
    markerAddedLeftVSIU.pline = vectorLeftVSIU;
    markerAddedLeftVSIU.parent = elementVSIU;
    markerAddedLeftVSIU.child = null;
    markerAddedRightVSIU.pline = vectorRightVSIU;
    markerAddedRightVSIU.parent = elementVSIU;
    markerAddedRightVSIU.child = null;
    //adding the vectors to the vectors array
    //	vectorsArray.push(vectorLeftVSIU);
    //	vectorsArray.push(vectorRightVSIU);

    //adding the markers to the markers array
    markersArray.push(markerAddedRightVSIU);
    markersArray.push(markerAddedLeftVSIU);

    //making the markers draggable	
    // for(i=0;i<counterMarker;i++){

    dragMarker(markerAddedRightVSIU);
    dragMarker(markerAddedLeftVSIU);
    highlightVector();

}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//this function is used to put pupup on right click on vectorslayer
function popupOnRightClickVector() {
    var positionNewPopupVector = null; ;
    //mouse move for vectorslayer
    vectorsLayer.events.register("mousemove", vectorsLayer, function (e) {
        $("#mapContainer").bind("contextmenu", function (event) {
            event.preventDefault();
        });
        //getting the pixel value of mouse move from previously defined dragMarker function over mouse move for map
        positionVectorLayer = positionNew;

    });

    //mouse down for vectorslayer
    vectorsLayer.events.register("mousedown", vectorsLayer, function (e) {
        $("#mapContainer").bind("contextmenu", function (event) {
            event.preventDefault();

        });
        //destroying all the popup
        var allPopup = mymap.popups;
        for (k = 0; k < allPopup.length; k++) {
            allPopup[k].destroy();
        }
        //Check whether right button clicked 
        if (OpenLayers.Event.isRightClick(e)) {
            var positionPopupVector = mymap.getLonLatFromPixel(positionVectorLayer);
            //creating the list on right click for vectorlayer
            var rightListVector = '<html><body><table><tr><td><b>ADD</b></td></tr><tr><td class="camera">Camera</td></tr><tr><td class="sensor">Sensor</td></tr></table></body>			        </html>';
            //creating the popup with the list for left click
            popupLeft = new OpenLayers.Popup(
             null,
			 positionPopupVector,
                   new OpenLayers.Size(70, 100),
                   rightListVector,
                   false);
            //adding the popup to the map
            mymap.addPopup(popupLeft);
            $(".camera").click(function () {
                popupLeft.destroy();
                //alert("h");
                //alert(popupLeft);						 
                //getting the size for camera
                var sizeCamera = new OpenLayers.Size(20, 25);
                //getting the start poition of camera
                var offsetCamera = new OpenLayers.Pixel(-(sizeCamera.w / 2), -sizeCamera.h);
                //getting the image for camera
                var iconCamera = new OpenLayers.Icon('content/PFMAP/IMG/camera.png', sizeCamera, offsetCamera);
                //creating a new marker for the camera
                var cameraAddedLatest = new OpenLayers.Marker(positionPopupVector, iconCamera);
                //adding the camera to the markers layer
                markersLayer.addMarker(cameraAddedLatest);
            }); //closing camera click option
            $(".sensor").click(function () {

                popupLeft.destroy();
                //getting the size for camera
                var sizeSensor = new OpenLayers.Size(20, 25);
                //getting the start poition of camera
                var offsetSensor = new OpenLayers.Pixel(-(sizeSensor.w / 2), -sizeSensor.h);
                //getting the image for camera
                var iconSensor = new OpenLayers.Icon('content/PFMAP/IMG/sensor.png', sizeSensor, offsetSensor);
                //creating a new marker for the camera
                var sensorAddedLatest = new OpenLayers.Marker(positionPopupVector, iconSensor);
                //adding the camera to the markers layer
                markersLayer.addMarker(sensorAddedLatest);
            }); //closing camera click option
        } //closing if condition 
        else
        // Check if Left button clicked 
            if (OpenLayers.Event.isLeftClick(e)) {

            }
    });

} //closing the popupOnRightClickVector

/////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function highlightVector() {
    var enable = 1;
    var report1 = function (e) {
        OpenLayers.Console.log(e.type, e.feature.id);
        vectorsLayer.style.strokeColor = "#ff0000";
        vectorsLayer.style.strokeWidth = 4;
    };
    var report3 = function (e) {
        OpenLayers.Console.log(e.type, e.feature.id);
        vectorsLayer.style.strokeColor = "#00ff00";
        vectorsLayer.style.strokeWidth = 2;
    };
    var report2 = function (e) {
        OpenLayers.Console.log(e.type, e.feature.id);
        vectorsLayer.style.strokeColor = "#00ff00";
        vectorsLayer.style.strokeWidth = 2;
    };
    var highlightCtrl = new OpenLayers.Control.SelectFeature(vectorsLayer, {
        hover: true,
        highlightOnly: true,
        renderIntent: "temporary",
        scope: null,
        eventListeners: {
            beforefeaturehighlighted: report1,
            featurehighlighted: report2,
            featureunhighlighted: report3
        }
    });

    var selectCtrl = new OpenLayers.Control.SelectFeature(vectorsLayer,
                { clickout: true }
            );

    mymap.addControl(highlightCtrl);
    mymap.addControl(selectCtrl);

    highlightCtrl.activate();
    selectCtrl.activate();
    /*mymap.events.register("mousemove", mymap, function(e) {      
    $("#mapContainer").bind("contextmenu", function(event) {
    event.preventDefault();
    });	
		
    if(enable==1){
    drawControls = {
              
    select: new OpenLayers.Control.SelectFeature(
    vectorsLayer,
    {
    clickout: false, toggle: false,
    multiple: false, hover: true,
    toggleKey: "ctrlKey", // ctrl key removes from selection
    multipleKey: "shiftKey", // shift key adds to selection
    box: true,
						
    }
    ),
    selecthover: new OpenLayers.Control.SelectFeature(
    vectorsLayer,
    {
    multiple: false, hover: true,
    toggleKey: "ctrlKey", // ctrl key removes from selection
    multipleKey: "shiftKey" // shift key adds to selection
    }
    )
    };
            
    for(var key in drawControls) {
    mymap.addControl(drawControls[key]);
    }
    drawControls['select'].activate();
    }

    });
    */
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//this function is used to change the size of both the end lines of vsiu
function changeSizeVector(element) {
    //this variable is used to perform drag event for markers
    var enable = 1;
    vectorsLayer.removeFeatures(element.pline);
    //this function invokes on mouse move for marker
    mymap.events.register("mousemove", mymap, function (e) {
        $("#mapContainer").bind("contextmenu", function (event) {
            event.preventDefault();
        });

        if (enable == 1) {
            //getting the pixel value of mouse move
            positionNewFound = e.xy;
            //making the element movable
            markersLayer.removeMarker(element);
            element.lonlat = mymap.getLonLatFromPixel(positionNewFound);
            markersLayer.addMarker(element);
        }
    });

    //this function invokes on mouse up for marker
    mymap.events.register("mouseup", mymap, function (e) {
        $("#mapContainer").bind("contextmenu", function (event) {
            event.preventDefault();
        });
        if (enable == 1) {
            element.pline.geometry = new OpenLayers.Geometry.LineString([new OpenLayers.Geometry.Point(element.parent.lonlat.lon, element.parent.lonlat.lat), new OpenLayers.Geometry.Point(element.lonlat.lon, element.lonlat.lat)]);
            //adding the features to the vectorlayer
            vectorsLayer.addFeatures(element.pline);
            enable = 0;
        } //closing the if condition
    }); //closing the mouseup for marker
} //closing the dragMarker


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//this fiunction is used to drag the markers(end points of line)
function dragMarker(element) {
    //this variable is used to perform drag event for markers

    var Present = false;
    var enable = 0;
    var markerAddedLatest;
    //this function invokes on mouse down for marker	
    element.events.register("mousedown", element, function (e) {
        $("#mapContainer").bind("contextmenu", function (event) {
            event.preventDefault();
        });

        //checking the mode selected
        if (lineResize()) {
            changeSizeVector(element);
        }
        else if (connectNetwork()) {
            for (i = 0; i <= positionsArray.length; i++) {
                if (positionsArray[i] == element.lonlat) {
                    Present = true;
                }
            }
            if (Present == false) {
                positionsArray.push(element.lonlat);
                counterConnect = counterConnect + 1;
                if (counterConnect == 2) {
                    var completeNetworksCoords = [];
                    for (var k = positionsArray.length - 2; k < positionsArray.length; k++) {
                        completeNetworksCoords.push(positionsArray[k]);
                    }
                    drawLineForNetworkCompletion(completeNetworksCoords);
                    counterConnect = 0;
                }
            }
        } //closing elseif for connect network
        else {
            var sizeCircle = new OpenLayers.Size(10, 10);
            //getting the start poition of marker
            var offsetCircle = new OpenLayers.Pixel(-(sizeCircle.w / 2), -sizeCircle.h);
            //getting the image for marker
            var iconCircle = new OpenLayers.Icon('content/PFMAP/IMG/circle.png', sizeCircle, offsetCircle);
            //addding a new marker on mouse down and assigning the associations to it from the element
            positionCurrent = element.lonlat;
            markerAddedLatest = new OpenLayers.Marker(positionCurrent, iconCircle);
            //	markerAddedLatest.id=++counterMarker;
            markerAddedLatest.pline = element.pline;
            markerAddedLatest.parent = element.parent;
            //markerAddedLatest.child=element;
            markersLayer.addMarker(markerAddedLatest);

            //	markersArray.push(markerAddedLatest);
            //dragMarkerChild(markerAddedLatest);

            enable = 1;
        }
    });


    //this function invokes on mouse move for marker
    mymap.events.register("mousemove", mymap, function (e) {
        $("#mapContainer").bind("contextmenu", function (event) {
            event.preventDefault();
        });

        positionNew = e.xy;
        if (enable == 1) {
            //getting the pixel value of mouse move
            positionNew = e.xy;
            //creating the move effect for the element
            markersLayer.removeMarker(element);
            element.lonlat = mymap.getLonLatFromPixel(positionNew);
            markersLayer.addMarker(element);


        }
    });

    //this function invokes on mouse up for marker
    mymap.events.register("mouseup", mymap, function (e) {
        $("#mapContainer").bind("contextmenu", function (event) {
            event.preventDefault();
        });
        if (enable == 1) {
            var LineNewCoords = [];
            //getting the lonlat form from the pixel value of current position
            var lonlatformCurrent = positionCurrent;
            //getting the point form from the lonlatform value of current position
            var pointformCurrent = new OpenLayers.Geometry.Point(lonlatformCurrent.lon, lonlatformCurrent.lat);

            //getting the lonlat form from the pixel value of new position
            var lonlatformNew = mymap.getLonLatFromPixel(positionNew);
            //getting the point form from the lonlatform value of new position
            var pointformNew = new OpenLayers.Geometry.Point(lonlatformNew.lon, lonlatformNew.lat);
            //creating the points array			
            LineNewCoords.push(pointformCurrent);
            LineNewCoords.push(pointformNew);
            //creating the new line from the points array	       	
            var lineString = new OpenLayers.Geometry.LineString(LineNewCoords);
            //creating the vector from the line
            var lineVector = new OpenLayers.Feature.Vector(lineString, null, style_red);
            //lineVector.fid=++counterVector+"";
            //adding the vector to the vectorlayer
            vectorsLayer.addFeatures([lineVector]);
            //performing the associations
            element.pline = lineVector;
            if (element.parent.parent != null)
                element.parent.child = markerAddedLatest;
            element.parent = markerAddedLatest;
            element.child = null;
            markerAddedLatest.child = element;
            //making the marker draggable created on mouse down
            dragMarkerChild(markerAddedLatest);
            markersArrayChildren.push(markerAddedLatest);
            //	vectorsArray.push(lineVector);
            enable = 0;
        } //closing the if condition
    }); //closing the mouseup for marker
} //closing the dragMarker


/////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
//this function draws a line for indicating network complete betwwn end markers
function drawLineForNetworkCompletion(positionsForCompletion) {
    calledFunctionNoTimes = calledFunctionNoTimes + 1;
    var Coords = [];
    var LineForNetwork = [];
    Coords[0] = positionsForCompletion[0];
    Coords[1] = positionsForCompletion[1];
    var pointNetwork1 = new OpenLayers.Geometry.Point(Coords[0].lon, Coords[0].lat);
    var pointNetwork2 = new OpenLayers.Geometry.Point(Coords[1].lon, Coords[1].lat);
    //creating the points array			
    LineForNetwork.push(pointNetwork1);
    LineForNetwork.push(pointNetwork2);
    //creating the new line from the points array	       	
    var line1 = new OpenLayers.Geometry.LineString(LineForNetwork);
    //creating the vector from the line
    var lineVector1 = new OpenLayers.Feature.Vector(line1, null, style_red);
    //adding the vector to the vectorlayer
    vectorsLayer.addFeatures([lineVector1]);
    //alert(markersArrayChildren[1].lonlat);
    if (calledFunctionNoTimes == vsiusLayer.markers.length) {
        for (i = 0; i < markersArrayChildren.length; i++) {
            markersArrayChildren[i].events.unregister("mousedown", markersArrayChildren[i]);
            //	markersLayer.removeMarker(markersArrayChildren[i]);
        }
        //alert(markersArrayChildren.length);

        for (j = 0; j < vsiusLayer.markers.length; j++) {
            var endmarkers = vsiusLayer.markers[j].child;
            for (i = 0; i < endmarkers.length; i++) {
                endmarkers[i].events.unregister("mousedown", endmarkers[i]);
                //	markersLayer.removeMarker(markersArrayChildren[i]);
            }
        }
        //enabling right click on vector layer so that sensors and markers can be placed, once the network is completed
        popupOnRightClickVector();
    }


}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//this fiunction is used to drag the markers(end points of line)
function dragMarkerChild(element) {
    //this variable is used to perform drag event for markers
    var enable = 0;
    //this function invokes on mouse down for marker	
    element.events.register("mousedown", element, function (e) {
        $("#mapContainer").bind("contextmenu", function (event) {
            event.preventDefault();
        });
        positionCurrent = element.lonlat;
        //markersArray.push(markerAddedLatest);
        enable = 1;
    });
    //this function invokes on mouse move for marker
    mymap.events.register("mousemove", mymap, function (e) {
        $("#mapContainer").bind("contextmenu", function (event) {
            event.preventDefault();
        });
        if (enable == 1) {
            //getting the pixel value of mouse move
            positionNew = e.xy;
            //making the element movable
            markersLayer.removeMarker(element);
            element.lonlat = mymap.getLonLatFromPixel(positionNew);
            markersLayer.addMarker(element);
        }
    });

    //this function invokes on mouse up for marker
    mymap.events.register("mouseup", mymap, function (e) {
        $("#mapContainer").bind("contextmenu", function (event) {
            event.preventDefault();
        });
        if (enable == 1) {
            //removing the features associated with the element
            vectorsLayer.removeFeatures(element.pline);
            vectorsLayer.removeFeatures(element.child.pline);
            //creating new features for the element
            element.pline.geometry = new OpenLayers.Geometry.LineString([new OpenLayers.Geometry.Point(element.parent.lonlat.lon, element.parent.lonlat.lat), new OpenLayers.Geometry.Point(element.lonlat.lon, element.lonlat.lat)]);
            element.child.pline.geometry = new OpenLayers.Geometry.LineString([new OpenLayers.Geometry.Point(element.child.lonlat.lon, element.child.lonlat.lat), new OpenLayers.Geometry.Point(element.lonlat.lon, element.lonlat.lat)]);
            //adding the features to the vectorlayer
            vectorsLayer.addFeatures(element.pline);
            vectorsLayer.addFeatures(element.child.pline);

            enable = 0;
        } //closing the if condition
    }); //closing the mouseup for marker
} //closing the dragMarker

function lineResize() {

    if ($("#selectResize").is(':checked')) {
        return true;
    }
    else {
        return false;

    }
}
function connectNetwork() {

    if ($("#selectConnect").is(':checked')) {
        return true;
    }
    else {
        return false;

    }
}