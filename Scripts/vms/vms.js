/*---------------------------------------------------------------\
+
+ JavaScript Code vms.js v1.2
+
+ Copyright 2011, Deepak Arora
+ Codescape Consultants Pvt. Ltd.
+ This file contains the common functions to manage video and vms interaction.
+ Date: Wed Nov 30 19:43:33 2010 -0500
+
+---------------------------------------------------------------*/

//#region ///  Variable Declaration  ///
var PlayState = [];
var TASK;
var refbutton;
var ptzallow = null;
var SelectedView = "Container_3x2";

var Ax_Frames = [{
    "id": "",
    status: 0,
    url: "",
    srl: "",
    lck: 0,
    ax: "Ax_Control_1x1",
    cam: "Camera_List1x1",
    "cname": "",
    "user": "",
    "pass": ""
}, {
    "id": "",
    status: 0,
    url: "",
    surl: "",
    lck: 0,
    ax: "Ax_Control_1x2",
    cam: "Camera_List1x2",
    "cname": "",
    "user": "",
    "pass": ""
}, {
    "id": "",
    status: 0,
    url: "",
    surl: "",
    lck: 0,
    ax: "Ax_Control_1x3",
    cam: "Camera_List1x3",
    "cname": "",
    "user": "",
    "pass": ""
}, {
    "id": "",
    status: 0,
    url: "",
    surl: "",
    lck: 0,
    ax: "Ax_Control_2x1",
    cam: "Camera_List2x1",
    "cname": "",
    "user": "",
    "pass": ""
}, {
    "id": "",
    status: 0,
    url: "",
    surl: "",
    lck: 0,
    ax: "Ax_Control_2x2",
    cam: "Camera_List2x2",
    "cname": "",
    "user": "",
    "pass": ""
}, {
    "id": "",
    status: 0,
    url: "",
    surl: "",
    lck: 0,
    ax: "Ax_Control_2x3",
    cam: "Camera_List2x3",
    "cname": "",
    "user": "",
    "pass": ""
}];

var Ax_Arr = ["Ax_Control_1x1", "Ax_Control_1x2", "Ax_Control_1x3", "Ax_Control_2x1", "Ax_Control_2x2", "Ax_Control_2x3"];
var vms_connected = false;
var fullWin = null;
var ptzWin = null
var lastCamFrameId = 0;
var Paused_Cameras = [];
var Maximized_Camera = [];
var Maximized_Ax_Control = null;

var PTZ_Camera = [];
var PTZ_Ax_Control = null;
var RunCallbackFunction;
var serverCheckWrapper;
var contentVideo;

//#endregion

// XML HTTP REQUEST SECTION -- ## Start ##
function GetXmlHttpObject(handler) {
    var objXmlHttp = null;

    if (navigator.userAgent.indexOf("Opera") >= 0) {
        jQuery('body').showMessage({ 'thisMessage': ['This application doesn\'t work in Opera'], 'className': 'fail', 'displayNavigation': false, autoClose: true });
        return;
    }
    if (navigator.userAgent.indexOf("MSIE") >= 0) {
        var strName = "Msxml2.XMLHTTP";
        if (navigator.appVersion.indexOf("MSIE 5.5") >= 0) {
            strName = "Microsoft.XMLHTTP";
        }
        try {
            objXmlHttp = new ActiveXObject(strName)
            objXmlHttp.onreadystatechange = handler
            return objXmlHttp;
        } catch (e) {
            jQuery('body').showMessage({ 'thisMessage': ['Error. Scripting for ActiveX might be disabled'], 'className': 'fail', 'displayNavigation': false, autoClose: true });
            return;
        }
    }
    if (navigator.userAgent.indexOf("Mozilla") >= 0) {
        objXmlHttp = new XMLHttpRequest();
        objXmlHttp.onload = handler;
        objXmlHttp.onerror = handler;
        return objXmlHttp;
    }
    xmlHttp.responseText = 0;
}

function flush_server_object() {
    var url = "../../VMS/XmlHttpRequest_Handler.ashx?TASK=Flush";
    xmlHttp = GetXmlHttpObject(stateChanged);
    xmlHttp.open("POST", url, true);
    xmlHttp.send(null);
}

function q() {
    var url = "../../VMS/XmlHttpRequest_Handler.ashx?TASK=QueryFlush";
    xmlHttp = GetXmlHttpObject(stateChanged);
    xmlHttp.open("POST", url, true);
    xmlHttp.send(null);
}

function Start_Streamer_OnServer(NAME) {
    var url = "../../VMS/XmlHttpRequest_Handler.ashx?NAME=" + NAME + "&TASK=StartStreamer";
    xmlHttp = GetXmlHttpObject(stateChanged);
    xmlHttp.open("POST", url, true);
    xmlHttp.send(null);
}

function RecordingHandler() {
    if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
        //alert("TASK = " + TASK + "\nxmlHttp.responseText =  " + xmlHttp.responseText);
        if (xmlHttp.responseText == "User does not have persmission to start recording !!" || xmlHttp.responseText == "User does not have permission to stop recording !!" || xmlHttp.responseText == "User does not have permission to query recording !!") {
            //document.getElementById(refbutton).disabled = true;
        } else {
            if (TASK == "Start Recording") {
                if (xmlHttp.responseText == "Exception occured while fetching camera settings." || xmlHttp.responseText == "Exception occured while starting recording.") {
                    jQuery('body').showMessage({ 'thisMessage': [xmlHttp.responseText], 'className': 'fail', 'displayNavigation': false, autoClose: true });
                } else if (xmlHttp.responseText == "Sucess.") {
                    document.getElementById(refbutton).recording = 1;
                } else if (xmlHttp.responseText == "Recording already in progress.") {
                    document.getElementById(refbutton).recording = 1;
                } else if (xmlHttp.responseText == "Scheduled Recording Stopped." || xmlHttp.responseText == "Sucess.") {
                    document.getElementById(refbutton).recording = 1;
                }
            }

            if (TASK == "Stop Recording") {
                if (xmlHttp.responseText == "Exception occured while fetching camera settings" || xmlHttp.responseText == "Unable to connect Recording Server.") {
                    jQuery('body').showMessage({ 'thisMessage': [xmlHttp.responseText], 'className': 'fail', 'displayNavigation': false, autoClose: true });                    
                } else if (xmlHttp.responseText == "Recording already stopped by other user." || xmlHttp.responseText == "Scheduled Recording Stopped.") {
                    jQuery('body').showMessage({ 'thisMessage': [xmlHttp.responseText], 'className': 'fail', 'displayNavigation': false, autoClose: true });
                    document.getElementById(refbutton).recording = 0;
                } else if (xmlHttp.responseText == "Sucess.") {
                    document.getElementById(refbutton).recording = 0;
                }
            }
        }


        if (TASK == "QueryRecording") {
            if (xmlHttp.responseText == "Exception occured while fetching camera settings") {
                recordingbutton.innerHTML = "Start Recoring";
                jQuery('body').showMessage({ 'thisMessage': ['Could  not fetch current recording status for this camera !!'], 'className': 'fail', 'displayNavigation': false, autoClose: true });                
            } else if (xmlHttp.responseText == "Stopped") {
                document.getElementById(refbutton).recording = 1;
            } else if (xmlHttp.responseText == "Running") {
                document.getElementById(refbutton).recording = 0;
            }
        }
    }
}

function stateChanged() {
    if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
        if (xmlHttp.responseText == "Device Added Successfully") {
            jQuery('body').showMessage({ 'thisMessage': [xmlHttp.responseText], 'className': 'fail', 'displayNavigation': false, autoClose: true });
            location.reload(true);
        } else if (xmlHttp.responseText == "Camera Deleted Successfully.") {
            jQuery('body').showMessage({ 'thisMessage': [xmlHttp.responseText], 'className': 'fail', 'displayNavigation': false, autoClose: true });
            location.reload(true);
        } else if (xmlHttp.responseText == "Device Updated Successfully.") {
            jQuery('body').showMessage({ 'thisMessage': [xmlHttp.responseText], 'className': 'fail', 'displayNavigation': false, autoClose: true });
            location.reload(true);
        } else if (xmlHttp.responseText == "Exception occured while starting streamer for this camera !!") {
            jQuery('body').showMessage({ 'thisMessage': [xmlHttp.responseText], 'className': 'fail', 'displayNavigation': false, autoClose: true });
        } else if (xmlHttp.responseText == "Streamer Started" || xmlHttp.responseText == "Streamer already started") {
            //alert(xmlHttp.responseText);
        } else if (xmlHttp.responseText != "") {
            //alert(xmlHttp.responseText);
        }
    }
}

// Stop the video running the player. Player element is passed in the function.
function Stop(Ax_Control) {
    var ax_index = $(Ax_Control).attr('axindex');
    if (Ax_Control.status == 1) {
        Ax_Control.Stop();
        Ax_Control.DisposeAll(true);
        Ax_Control.status = 0;

        // Resetting the frame variables
        Ax_Frames[ax_index].id = "";
        Ax_Frames[ax_index].status = 0;
        Ax_Frames[ax_index].url = "";
        Ax_Frames[ax_index].surl = "";
        Ax_Frames[ax_index].lck = 0;
        Ax_Frames[ax_index].cname = "";
        Ax_Frames[ax_index].user = "";
        Ax_Frames[ax_index].pass = "";
        Ax_Control.locked = 0;

        if (window.opener && window.opener.mapsWin)
            window.opener.mapsWin.myMap.changeMultipleCameraImg([{ id: Ax_Control.cam, isOn: 0}]);
        
        
        Ax_Control.cam = "";

        // Removing Lock Border if it exist.
        $(Ax_Control).parent().parent().removeClass('lockBorder');
    }
}

// Stop the video running the player. Player element is passed in the function.
function Record(Ax_Control) {
    if (Ax_Control.recording == 0) {
        Recording("StartRecording", Ax_Control.videoid);
        TASK = "Start Recording";
        Ax_Control.recording = 1;
    } else if (Ax_Control.recording == 1) {
        Recording("StopRecording", Ax_Control.videoid);
        TASK = "Stop Recording";
        Ax_Control.recording = 0;
    }
    refbutton = Ax_Control.id;
}

function Recording(TASK, ID) {
    var url = "../../VMS/XmlHttpRequest_Handler.ashx?TASK=" + TASK + "&ID=" + ID;
    xmlHttp = GetXmlHttpObject(RecordingHandler);
    xmlHttp.open("POST", url, true);
    xmlHttp.send(null);
}

function Ref() {
    var indexx = PlayState.length;
    for (var i = 0; i <= indexx - 1; i++) {
        document.getElementById(PlayState[i]).Stop();
        delete document.getElementById(PlayState[i]);
    }
    PlayState.splice(0, indexx);
}

function setCookie(c_name, value, exdays) {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value = escape(value) + ((exdays === null) ? "" : "; expires=" + exdate.toUTCString());
    document.cookie = c_name + "=" + c_value;
}

function getCookie(c_name) {
    var i, x, y, ARRcookies = document.cookie.split(";");
    for (i = 0; i < ARRcookies.length; i++) {
        x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
        y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
        x = x.replace(/^\s+|\s+$/g, "");
        if (x == c_name) {
            return unescape(y);
        }
    }
    return;
}

/*
* Getting the camera details like ( username, password, stream url, camera url etc.
*/
function getCameraDetails(camName) {
    // If vms server connection is not established.
    if (typeof (camname) == 'undefined')
        return -2;

    // Found the desired camera's index.
    for (var i = 0; i < camname.length; i++) {
        if (camname[i] == camName) {
            return i;
        }
    }   
}

//#region ///  Camera PTZ Control Functions ////

/*
* This function is used to control the Pan, Tilt and Zoom of PTZ Cameras.
*/
function PTZ(camname, action) {
    doptz('PTZ-' + action, camname);
}

/*
* Send request to HTTP hander for doing camera preset.
*/
function doptz(tag, id) {
    var url = "../../VMS/XmlHttpRequest_Handler.ashx?TASK=" + tag + "&ID=" + id;
    MyIFrame = document.getElementById("Download_Frame");
    MyIFrame.src = url;
}

/*
* This function set the camera at a particular preset.
*/
function presetgo(camId, presetID) {
    var url = "../../VMS/XmlHttpRequest_Handler.ashx?TASK=PRESET-GO&ID=" + camId + "&PRESETID=" + presetID;
    MyIFrame = document.getElementById("Download_Frame");
    MyIFrame.src = url;
}

/*
* This function Stores a preset for a camera in VMS server.
*/
function presetstore(camId,presetID) {
    var url = "../../VMS/XmlHttpRequest_Handler.ashx?TASK=PRESET-STORE&ID=" + camId + "&PRESETID=" + presetID;
    MyIFrame = document.getElementById("Download_Frame");
    MyIFrame.src = url;
}

//#endregion

