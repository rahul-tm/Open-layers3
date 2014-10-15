/*!
* JavaScript Code Common.js v1.2
*
* By : Deepak Arora
* Codescape Consultants Pvt. Ltd.
* This file contains the Common functions used to interact with VMS server.
* Project: Perimeter Intrusion Detection System
* Date: Sep 10, 2012 19:43:33 2010 -0500
*
*/

//#region Variables Declaration

var PlayState = new Array();
var TASK;
var refbutton;
var IsLogOff = false;
var activePtzCam = null;               // Store the name of the camera whose preset panel is activate.

//#endregion

//#region camera control functions ////

// --- Start [XML HTTP REQUEST SECTION]
function GetXmlHttpObject(handler) {
    var objXmlHttp = null

    if (navigator.userAgent.indexOf("Opera") >= 0) {
        alert("This application doesn't work in Opera")
        return
    }
    if (navigator.userAgent.indexOf("MSIE") >= 0) {
        var strName = "Msxml2.XMLHTTP"
        if (navigator.appVersion.indexOf("MSIE 5.5") >= 0) {
            strName = "Microsoft.XMLHTTP"
        }
        try {
            objXmlHttp = new ActiveXObject(strName)
            objXmlHttp.onreadystatechange = handler
            return objXmlHttp
        }
        catch (e) {
            alert("Error. Scripting for ActiveX might be disabled")
            return
        }
    }
    if (navigator.userAgent.indexOf("Mozilla") >= 0) {
        objXmlHttp = new XMLHttpRequest()
        objXmlHttp.onload = handler
        objXmlHttp.onerror = handler
        return objXmlHttp
    }
    xmlHttp.responseText = 0;
}
// --- End [XML HTTP REQUEST SECTION]

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

function Recording(TASK, ID, _refbutton) {
    var url = "../../VMS/XmlHttpRequest_Handler.ashx?TASK=" + TASK + "&ID=" + ID;
    xmlHttp = GetXmlHttpObject(RecordingHandler);
    xmlHttp.open("POST", url, true);
    xmlHttp.send(null);
}

function RecordingHandler() {
    if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
        if (xmlHttp.responseText == "User does not have persmission to start recording !!" || xmlHttp.responseText == "User does not have permission to stop recording !!" || xmlHttp.responseText == "User does not have permission to query recording !!") {
            document.getElementById(refbutton).disabled = true;
        }
        else {
            if (TASK == "Start Recording") {
                if (xmlHttp.responseText == "Exception occured while fetching camera settings." || xmlHttp.responseText == "Exception occured while starting recording.")
                    alert(xmlHttp.responseText);
                else if (xmlHttp.responseText == "Recording already in progress.") {
                    alert(xmlHttp.responseText);
                    document.getElementById(refbutton).innerHTML = "Stop Recording";
                }
                else if (xmlHttp.responseText == "Scheduled Recording Stopped." || xmlHttp.responseText == "Sucess.")
                    document.getElementById(refbutton).innerHTML = "Stop Recording";
                else
                    alert(xmlHttp.responseText);
            }

            if (TASK == "Stop Recording") {
                if (xmlHttp.responseText == "Exception occured while fetching camera settings" || xmlHttp.responseText == "Unable to connect Recording Server.") {
                    alert(xmlHttp.responseText);
                }
                else if (xmlHttp.responseText == "Recording already stopped by other user." || xmlHttp.responseText == "Scheduled Recording Stopped.") {
                    alert(xmlHttp.responseText);
                    document.getElementById(refbutton).innerHTML = "Start Recording";
                }
                else if (xmlHttp.responseText == "Sucess.") {
                    document.getElementById(refbutton).innerHTML = "Start Recording";
                }
            }
        }

        if (TASK == "QueryRecording") {
            if (xmlHttp.responseText == "Exception occured while fetching camera settings") {
                recordingbutton.innerHTML = "Start Recoring";
                alert("Could  not fetch current recording status for this camera !!");
            }
            else if (xmlHttp.responseText == "Stopped") {
                document.getElementById(refbutton).innerHTML = "Start Recording";
            }
            else if (xmlHttp.responseText == "Running") {
                document.getElementById(refbutton).innerHTML = "Stop Recording";
            }
        }
    }
}

function stateChanged() {
    if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {

        if (xmlHttp.responseText == "Device Added Successfully") {
            alert(xmlHttp.responseText);
            location.reload(true);
        }
        else if (xmlHttp.responseText == "Camera Deleted Successfully.") {
            alert(xmlHttp.responseText);
            location.reload(true);
        }
        else if (xmlHttp.responseText == "Device Updated Successfully.") {
            alert(xmlHttp.responseText);
            location.reload(true);
        }
        else if (xmlHttp.responseText == "Exception occured while starting streamer for this camera !!") {
            alert(xmlHttp.responseText);
        }
        else if (xmlHttp.responseText == "Streamer Started" || xmlHttp.responseText == "Streamer already started") {
            //alert(xmlHttp.responseText);
        }
        else if (xmlHttp.responseText != "") {
            //alert(xmlHttp.responseText);
        }
    }
}
// --- END [XML HTTP REQUEST SECTION]

/*
* Play Method for Live view page
*/
function PlayURL(Mode, camlist, Ax_Control) {
    var indexx = PlayState.length
    PlayState[indexx] = Ax_Control.id;
    var camname = camlist.selectedIndex;
    if (Mode.value.toString() == "Camera") {
        if (camname != 0) {
            var id = camlist.value;
            var idd = camlist.selectedIndex - 1;    
            var name = camname[idd];
            var url = cameraurl[idd];
            var cname = camlist.options[camlist.selectedIndex].text;
            var temp = Ax_Control.Play(id, cname, url, user[idd], pass[idd], false, Ax_Control.id + ":" + camlist.id);

            if (temp != "" && temp != "Wrong camera ID") {
                var vals = new Array();
                vals = temp.split(":");
                document.getElementById(vals[0]).Stop();
                document.getElementById(vals[1]).selectedIndex = 0;
            }
            return;
        }
        else {
            alert("Please Select the Camera before selecting the mode.");
            Mode.selectedIndex = 0;
            return;
        }
    }
    else if (Mode.value.toString() == "Server") {
        if (camname != 0) {

            var id = camlist.value;
            var idd = camlist.selectedIndex - 1;
            var name = camname[idd];
            var url = streamingurl[idd];
            var cname = camlist.options[camlist.selectedIndex].text;

            Start_Streamer_OnServer(cname);

            var temp = Ax_Control.Play(id, cname, "", user[idd], pass[idd], false, Ax_Control.id + ":" + camlist.id);
            if (temp != "" && temp != "Wrong camera ID") {
                var vals = new Array();
                vals = temp.split(":");
                document.getElementById(vals[0]).Stop();
                document.getElementById(vals[1]).selectedIndex = 0;
            }
            return;
        }
        else {
            alert("Please Select the Camera before before selecting the mode.");
            Mode.selectedIndex = 0;
            return;
        }
    }

    else {
        alert("Please select the Playing Mode");
        return;
    }
}

function PlayURL2(Mode, camlist, Ax_Control, Record) {
    Mode.selectedIndex = 1;
    refbutton = Record.id;
    PlayURL(Mode, camlist, Ax_Control);

    TASK = "QueryRecording";
    Recording(TASK, camlist.value, Record);
}

function Stop(Ax_Control, camlist) {
    Ax_Control.Stop();
    Ax_Control.DisposeAll(true);
    camlist.selectedIndex = 0;
}

function Record(_refbutton, camlist) {
    if (_refbutton.innerHTML == "Start Recording") {
        Recording("StartRecording", camlist.value);
        refbutton = _refbutton.id;
        TASK = "Start Recording";
    }
    else if (_refbutton.innerHTML == "Stop Recording") {
        Recording("StopRecording", camlist.value);
        refbutton = _refbutton.id;
        TASK = "Stop Recording";
    }
}

//#endregion

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
    var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
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
}

//#region Camera PTZ Control Functions ////

/*
* This function is used to control the Pan, Tilt and Zoom of PTZ Cameras.
*/
function PTZ(element, action) {
    doptz('PTZ-' + action, activePtzCam);
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
function presetgo(command, val) {
    var url = "../../VMS/XmlHttpRequest_Handler.ashx?TASK=" + command + "&ID=" + activePtzCam + "&PRESETID=" + val;
    MyIFrame = document.getElementById("Download_Frame");
    MyIFrame.src = url;
}

/*
* This function Stores a preset for a camera in VMS server.
*/
function presetstore(command, val) {
    var url = "../../VMS/XmlHttpRequest_Handler.ashx?TASK=" + command + "&ID=" + activePtzCam + "&PRESETID=" + val;
    MyIFrame = document.getElementById("Download_Frame");
    MyIFrame.src = url;
}

//#endregion

//#region Garbaze Code     ////
/*
function Ptz(_ptzbutton, camlist) {

var name = camlist.options[camlist.selectedIndex].text;
if (name.indexOf(".") != -1) {
for (i = 0; i <= name.length; i++)
{ name = name.replace(".", ""); }
}
var id = camlist.value;
var idd = camlist.selectedIndex - 1;
var continous = supportcontinousptz[idd];

if (id != "Default") {
testwindow = window.open("ptz.htm", "CameraName", "location=1,toolbar=0,scrollbars=0,location=0,dependent=1,statusbar=0,menubar=0,resizable=0,width=360,height=130");
testwindow.moveTo(0, 0);
var tmp = testwindow.document;
tmp.write('<html><head><title>PTZ :' + camlist.options[camlist.selectedIndex].text + '</title>');
tmp.write('\n');

tmp.write('</head><body background="Images/bg.jpg" >');
tmp.write('<div id=\'info\' style="font-family:Tahoma; font-size:12px;color:#FFFFFF;">PTZ Control For : ' + camlist.options[camlist.selectedIndex].text + ' </div>');
if (continous = true) {
tmp.write('<button name=\'PTZ-UPLEFT\' onMouseDown=\"window.opener.doptz(this.name,' + id + ');\" onMouseUp=\"window.opener.doptz(\'PTZ-STOP\',' + id + ');\" type=\"button\">UP-LEFT</button><button name=\'PTZ-UP\' onMouseDown=\"window.opener.doptz(this.name,' + id + ');\" onMouseUp=\"window.opener.doptz(\'PTZ-STOP\',' + id + ');\" type=\"button\">UP</button><button name=\'PTZ-UPRIGHT\' onMouseDown=\"window.opener.doptz(this.name,' + id + ');\" onMouseUp=\"window.opener.doptz(\'PTZ-STOP\',' + id + ');\" type=\"button\">UP-RIGHT</button><input id=\"autopan\" type=\"checkbox\" onClick=\" if(this.checked){window.opener.doptz(\'PTZ-RIGHT\',' + id + ');}else{window.opener.doptz(\'PTZ-STOP\',' + id + ');} \" /><label style="font-family:Tahoma; font-size:12px;color:White;">AUTO-PAN</label></br>');
tmp.write('<button name=\'PTZ-LEFT\' onMouseDown=\"window.opener.doptz(this.name,' + id + ');\" onMouseUp=\"window.opener.doptz(\'PTZ-STOP\',' + id + ');\" type=\"button\">LEFT</button><button name=\'PTZ-ZOOMIN\' onMouseDown=\"window.opener.doptz(this.name,' + id + ');\" onMouseUp=\"window.opener.doptz(\'PTZZ-STOP\',' + id + ');\" type=\"button\">ZOOM-IN</button><button name=\'PTZ-ZOOMOUT\' onMouseDown=\"window.opener.doptz(this.name,' + id + ');\" onMouseUp=\"window.opener.doptz(\'PTZZ-STOP\',' + id + ');\" type=\"button\">ZOOM-OUT</button><button name=\'PTZ-RIGHT\' onMouseDown=\"window.opener.doptz(this.name,' + id + ');\" onMouseUp=\"window.opener.doptz(\'PTZ-STOP\',' + id + ');\" type=\"button\">RIGHT</button></br>');
tmp.write('<button name=\'PTZ-DOWNLEFT\' onMouseDown=\"window.opener.doptz(this.name,' + id + ');\" onMouseUp=\"window.opener.doptz(\'PTZ-STOP\',' + id + ');\" type=\"button\">DOWN-LEFT</button><button name=\'PTZ-DOWN\' onMouseDown=\"window.opener.doptz(this.name,' + id + ');\" onMouseUp=\"window.opener.doptz(\'PTZ-STOP\',' + id + ');\" type=\"button\">DOWN</button><button name=\'PTZ-DOWNRIGHT\' onMouseDown=\"window.opener.doptz(this.name,' + id + ');\" onMouseUp=\"window.opener.doptz(\'PTZ-STOP\',' + id + ');\" type=\"button\">DOWN-RIGHT</button>');
}
else {
tmp.write('<button name=\'PTZ-UPLEFT\' onClick=\"window.opener.doptz(this.name,' + id + ');\"  type=\"button\">UP-LEFT</button><button name=\'PTZ-UP\' onClick=\"window.opener.doptz(this.name,' + id + ');\"  type=\"button\">UP</button><button name=\'PTZ-UPRIGHT\' onClick=\"window.opener.doptz(this.name,' + id + ');\"  type=\"button\">UP-RIGHT</button></br>');
tmp.write('<button name=\'PTZ-LEFT\' onClick=\"window.opener.doptz(this.name,' + id + ');\"  type=\"button\">LEFT</button><button name=\'PTZ-ZOOMIN\' onClick=\"window.opener.doptz(this.name,' + id + ');\"  type=\"button\">ZOOM-IN</button><button name=\'PTZ-ZOOMOUT\' onClick=\"window.opener.doptz(this.name,' + id + ');\"  type=\"button\">ZOOM-OUT</button><button name=\'PTZ-RIGHT\' onClick=\"window.opener.doptz(this.name,' + id + ');\"  type=\"button\">RIGHT</button></br>');
tmp.write('<button name=\'PTZ-DOWNLEFT\' onClick=\"window.opener.doptz(this.name,' + id + ');\"  type=\"button\">DOWN-LEFT</button><button name=\'PTZ-DOWN\' onClick=\"window.opener.doptz(this.name,' + id + ');\" type=\"button\">DOWN</button><button name=\'PTZ-DOWNRIGHT\' onClick=\"window.opener.doptz(this.name,' + id + ');\"  type=\"button\">DOWN-RIGHT</button>');

}
tmp.write('</br>');
tmp.write('<select id=\'presetno\'> ');
for (var k = 1; k <= 127; k++) {
tmp.write('<option value="' + k + '">' + k + '</option>');
}
tmp.write('</select> ');
tmp.write('<button name=\'PRESET-GO\' onClick=\"window.opener.presetgo(this.name,' + id + ',document.getElementById(\'presetno\').value);\"  type=\"button\">Preset Go</button>');
tmp.write('<button name=\'PRESET-STORE\' onClick=\"window.opener.presetstore(this.name,' + id + ',document.getElementById(\'presetno\').value);\"  type=\"button\">Preset Store</button>');

tmp.write('</body></html>');
tmp.close();
if (window.focus) { testwindow.focus(); }
}
else {
alert("Please select a camera before selecting PTZ control.");
}
}
*/
//#endregion
