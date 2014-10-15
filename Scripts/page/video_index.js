/*---------------------------------------------------------------\
+
+ Project     : Perimeter Intrusion Detection System
+ Filename    : video_index.js
+ Module Name : Live Feed integration in the system
+ Purpose     : This file contains the common functions to manage video and vms interaction.
+ Coded By    : Deepak Arora (Codescape Consultants Pvt. Ltd.) 
+ Date        : Jun 11, 2012 19:43:33 2010 -0500
+  
+---------------------------------------------------------------*/

var fullCamObj;
var ptzCamObj;
var initServer;
var contentVideo;
var serverCheckWrapper;

if (document.all) {
    document.onkeydown = function () {
        var key_f5 = 116; // 116 = F5
        if (key_f5 == event.keyCode) {
            event.keyCode = 0;
            alert("Sorry! You can not refresh this page.");
            return false;
        }
    }
}

$(function () {
    serverCheckWrapper = $('#serverCheckWrapper');
    contentVideo = $('#axPanel');
    
    /* Initialize VMS server */
    initServer = setTimeout("initializeVMSServer()", 4000);    
});

//// Initializing the VMS Server. This must be synchronous request. Because it loads some script that we need to interact with
//// VMS server. so don't remove async: false property. 
//function initializeVMSServer() {
//    $.ajax(
//    {
//        type: "GET",
//        url: "/Video/InitializeVMSServers",
//        async: false,
//        success: function (vms_result) {
//            if (vms_result != "ServerError") {  // if successfully interact with vms server.
//                serverCheckWrapper.hide();
//                contentVideo.show();
//                // vms_result :: is the data received from the vms server that contains the all cameras details.
//                $('body').append(vms_result);
//                vms_connected = true;
//                clearTimeout(initServer);
//            }
//            else {  // if there is some problem in interacting with vms server.
//                serverCheckWrapper.show();
//                contentVideo.hide();
//            }
//        },
//        error: function (err) {
//            contentVideo.hide();
//            serverCheckWrapper.show();
//        }
//    });
//}

/*
* This function load the stream in the live feed window.
*/
function TakeAction(obj) {
    var Ax_Control = document.getElementById(obj.ax);
    var indexx = PlayState.length;
    PlayState[indexx] = (obj.ax + ":" + obj.cam);

    try {
        // Stream video from server.
        Start_Streamer_OnServer(obj.cname);
        Ax_Control.cam = obj.cname;

        var temp = Ax_Control.Play(lastCamFrameId, obj.cname, obj.url, obj.user, obj.pass, false, (obj.ax + ":" + obj.cam));
        Ax_Control.status = 1;
        Ax_Control.videoid = obj.id;
        Ax_Control.ptz = obj.ptz;
        Ax_Control.continousptz = obj.continousptz;
        
    } catch (e) {
        if (navigator.userAgent.indexOf("MSIE") == -1) {
            jQuery('body').showMessage({ 'thisMessage': ['Live feed functionality is currently availabe in Internet Explorer only.'], 'className': 'fail', 'displayNavigation': false, autoClose: true });
            $('#showMessage').css('left', parseInt((screen.width / 2) - ($('#showMessage').width() / 2)));
        }
    }
    return;
}

/*
* Turning on the Live Feed in the corrosponding Video Frame. 
*/
function TurnOnCamera(camName) {
    //alert("TurnOnCamera: "+camName); //pankaj
    // Get the index of the camera to fetch information retrieved from VMS layer.
    var vmsIndex = getCameraDetails(camName);
    //alert(vmsIndex);//pankaj
    vmsIndex = 0;
    if (vmsIndex != -1) {
        
        for (var j = 0; j < Ax_Frames.length; j++) {
            if (Ax_Frames[j].cname == camName) {
                return false;
            }
        }

        var found = false;
        
        if (lastCamFrameId == 6) lastCamFrameId = 0;

        for (var camIndex = lastCamFrameId; camIndex < 6; camIndex++) {
            //if (Ax_Frames[camIndex].lck == 0 && Ax_Frames[camIndex].status == 0) { // Check for camera not locked or running video.
            

            if ($("#" + Ax_Arr[lastCamFrameId]).attr('locked') == 0) { // Check for camera not locked.
                found = true;
                Ax_Frames[camIndex].user = user[vmsIndex];
                Ax_Frames[camIndex].pass = pass[vmsIndex];
                Ax_Frames[camIndex].id = camid[vmsIndex];
                Ax_Frames[camIndex].url = cameraurl[vmsIndex];
                Ax_Frames[camIndex].cname = camname[vmsIndex];
                Ax_Frames[camIndex].surl = streamingurl[vmsIndex];
                Ax_Frames[camIndex].status = 1;
                Ax_Frames[camIndex].ptz = supportedptz[vmsIndex];
                Ax_Frames[camIndex].continousptz = supportcontinousptz[vmsIndex];

                $('.record[frame=' + (camIndex + 1) + ']:first').attr('videoid', camid[vmsIndex]);
                
                TakeAction(Ax_Frames[camIndex]);
                lastCamFrameId = lastCamFrameId + 1;
                break;
            }
            lastCamFrameId = (lastCamFrameId == 6) ? 0 : (lastCamFrameId + 1);
        }

        if (!found) {
            jQuery('body').showMessage({ 'thisMessage': ['No Camera is free. Please unlock a camera.'], 'className': 'fail', 'displayNavigation': false, autoClose: true });
            $('#showMessage').css('left', parseInt((screen.width / 2) - ($('#showMessage').width() / 2)));
            return false;
        }
    } else {
        jQuery('body').showMessage({ 'thisMessage': ['No camera found for live coverage.'], 'className': 'fail', 'displayNavigation': false, autoClose: true });
        $('#showMessage').css('left', parseInt((screen.width / 2) - ($('#showMessage').width() / 2)));
    }
}


/*
* Turning on the Live Feed in the corrosponding Video Frame.  //pankaj---> to ON the camera on Immediate alert on sensor.
*/
function ImmdiateTurnOnCamera(camName) {
    //alert("TurnOnCamera: "+camName); //pankaj
    // Get the index of the camera to fetch information retrieved from VMS layer.
    var vmsIndex = getCameraDetails(camName);
    //alert(vmsIndex);//pankaj
    vmsIndex = 0;
    if (vmsIndex != -1) {

        for (var j = 0; j < Ax_Frames.length; j++) {
            if (Ax_Frames[j].cname == camName) {
                return false;
            }
        }
        
        var found = false;

        if (lastCamFrameId == 6) lastCamFrameId = 0;

        for (var camIndex = lastCamFrameId; camIndex < 6; camIndex++) {
            //if (Ax_Frames[camIndex].lck == 0 && Ax_Frames[camIndex].status == 0) { // Check for camera not locked or running video.


            if ($("#" + Ax_Arr[lastCamFrameId]).attr('locked') == 0) { // Check for camera not locked.
                found = true;
                Ax_Frames[camIndex].user = user[vmsIndex];
                Ax_Frames[camIndex].pass = pass[vmsIndex];
                Ax_Frames[camIndex].id = camid[vmsIndex];
                Ax_Frames[camIndex].url = cameraurl[vmsIndex];
                Ax_Frames[camIndex].cname = camname[vmsIndex];
                Ax_Frames[camIndex].surl = streamingurl[vmsIndex];
                Ax_Frames[camIndex].status = 1;
                Ax_Frames[camIndex].ptz = supportedptz[vmsIndex];
                Ax_Frames[camIndex].continousptz = supportcontinousptz[vmsIndex];

                $('.record[frame=' + (camIndex + 1) + ']:first').attr('videoid', camid[vmsIndex]);

                TakeAction(Ax_Frames[camIndex]);
                lastCamFrameId = lastCamFrameId + 1;
                break;
            }
            lastCamFrameId = (lastCamFrameId == 6) ? 0 : (lastCamFrameId + 1);
        }

        if (!found) {
            jQuery('body').showMessage({ 'thisMessage': ['No Camera is free. Please unlock a camera.'], 'className': 'fail', 'displayNavigation': false, autoClose: true });
            $('#showMessage').css('left', parseInt((screen.width / 2) - ($('#showMessage').width() / 2)));
            return false;
        }
    } else {
        jQuery('body').showMessage({ 'thisMessage': ['No camera found for live coverage.'], 'className': 'fail', 'displayNavigation': false, autoClose: true });
        $('#showMessage').css('left', parseInt((screen.width / 2) - ($('#showMessage').width() / 2)));
    }
}


/*
* Getting the camera details like ( username, password, stream url, camera url etc.//pankaj
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




window.onbeforeunload = WindowCloseHanlder;
function WindowCloseHanlder() {
    if (navigator.appName == "Microsoft Internet Explorer") {
        if (ptzWin != null)
            ptzWin.close();

        var Ax_Arr = ["Ax_Control_1x1", "Ax_Control_1x2", "Ax_Control_1x3", "Ax_Control_2x1", "Ax_Control_2x2", "Ax_Control_2x3"];

        // Stopping the video feed when Live Feed window is closed.
        var i = 0;
        try {
            var ax;
            for (i = 0; i < Ax_Arr.length; i++) {
                ax = document.getElementById(Ax_Arr[i]);
                if (ax.status == 1) {
                    ax.stop();
                    ax.DisposeAll(true);
                }
            }
        } catch (e) { alert('Stop Error in VMS Server ' + i + " -->" + e); }

        try {
            /*-- Removing the instance of the window from parent window.*/
            if (window.opener) if (window.opener.liveWin) window.opener.liveWin = null;

            if (fullWin) fullWin = null;
        } catch (e) { }
    }
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

        $(Ax_Control).attr('locked', (Ax_Control.locked == 1) ? 0 : 1);
    }
}

/*
* Call on live feed load complete.
*/
function LiveFeedLoadComplete() {
    window.opener.liveWin = window;
}

//#region /// PTZ Screen Functions  ///

/*
* Open the PTZ video.
*/
function OpenPTZScreenWindow(frame) {
    ptzWin = window.open('../Video/Ptz', 'PTZ', "width=" + 510 + ", height=" + 302 + ",top=" + 0 + ", left=" + 0 + ", location=no, menubar=no, scrollbars=no, status=no, toolbar=no,resizable=1,copyhistory= no,fullscreen=no");
    ptzCamObj = Ax_Frames[frame];
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
* Call on PTZ Screen load completes.
*/
function onPTZScreenLoad() {
    $(ptzWin).resize(function () {
        ptzWin.resizeTo(510,302);
    });
    ptzWin.ptzLoadComplete(ptzCamObj);
}

//endregion

/*
* Initializing the VMS Server. This must be synchronous request. Because it loads some script that we need to interact with
* VMS server. so don't remove async: false property. 
*/
function initializeVMSServer() {
    //alert("in initializeVMSServer");
    $.ajax({
        type: "GET",
        url: "/Video/InitializeVMSServer",
        async: false,
        success: function (result) {
            //alert("vms_result: " + result);       
            if (result.status != false) { // if successfully interact with vms server.
                serverCheckWrapper.hide();
                contentVideo.show();
                $('body').append(result.camdata);
                vms_connected = true;
            } else { // if there is some problem in interacting with vms server.                
                    serverCheckWrapper.show();
                    contentVideo.hide();
            }
        },
        error: function (err) {
            contentVideo.hide();
            serverCheckWrapper.show();
        }
    });
}


//#region /// FullScreen Function ///

// Open the FullScreen video.
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
* $$$$ Under Progress $$$$$         
* For Full Screen Video Live Feed 
*/
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
* Restore the video from fullscreen to restored activeX.
*/
function RestoreVideo() {
    var temp = Maximized_Ax_Control.Play(Maximized_Camera.id, Maximized_Camera.cname, Maximized_Camera.url, Maximized_Camera.user, Maximized_Camera.pass, false, (Maximized_Camera.ax + ":" + Maximized_Camera.cam));
    Maximized_Camera = {};
    Maximized_Ax_Control = null;
    return;
}

/* 
* Callback function of map screen load.
*/
function fullWinCallback(frame) {
    try {
        if (fullWin.LiveFeedLoadComplete) {
            //document.getElementById(Ax_Frames[frame].ax).Stop();
            //document.getElementById(Ax_Frames[frame].ax).DisposeAll(true);   
            setTimeout(new function () {
                fullWin.LiveFeedLoadComplete(Ax_Frames[frame]);
            }, 2000);
            return;
        } else {
            setTimeout(new function () {
                fullWinCallback(frame);
            }, 2000);
        }
    } catch (e) {
        setTimeout(new function () {
            fullWinCallback(frame);
        }, 2000);
    }
}

/*
* Calling the PRSET GO for cameras.
*/
function doPTZForAlarm(camPTZ) {    
    if (vms_connected) {       
        for (i in camPTZ) {
            if (camPTZ.hasOwnProperty(i)) {
                if (typeof(console) != 'undefined')
                    console.log('Setting the camera ' + camPTZ[i].cam + ' to preset ' + camPTZ[i].ptz);

                presetgo(camPTZ[i].cam, camPTZ[i].pr)
            }
        }
    }
}


//#endregion 

/*
* Opens the PTZ panel
*/
/*
function openPTZControl(Ax_Control) {    
$('.contentVideo').css('visibility','hidden');
$('#ptzController').css('visibility', 'visible');
$('.grey_overlay').css('visibility', 'visible');

var PTZ_AX = document.getElementById('Ax_Control');
var obj = Ax_Frames[$(Ax_Control).attr('axindex')];
    
try {
// Stream video from server.
Start_Streamer_OnServer(obj.cname);
var temp = PTZ_AX.Play(obj.id, obj.cname, obj.url, obj.user, obj.pass, false, (obj.ax + ":" + obj.cam));
docuement.getElementById('hidPTZCam').value = obj.cam;

} 
catch (e) {
if (navigator.userAgent.indexOf("MSIE") == -1) {
jQuery('body').showMessage({ 'thisMessage': ['Live feed functionality is currently availabe in Internet Explorer only.'], 'className': 'fail', 'displayNavigation': false, autoClose: true });
$('#showMessage').css('left', parseInt((screen.width / 2) - ($('#showMessage').width() / 2)));
}
}
return;
}
*/

/*
function videoLockAction() { //function to lock video
$(".lockedVideo").hide(); //hide lock design fromm all video
$(".lock").click(function (ax_control) { //on click lock button
        
$(this).parent().parent().find('.lockedVideo').toggle(); // find current video and show or hide lock(red)
$(this).parent().parent().toggleClass('lockBorder'); // find current video and show or hide border(red)
});
}*/

