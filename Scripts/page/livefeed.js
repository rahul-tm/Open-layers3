/*---------------------------------------------------------------\
+
+ Project     : Perimeter Intrusion Detection System
+ Filename    : livefeed.js
+ Module Name : Multi Screen Integration.
+ Purpose     : JS for multiple screen handling.
+ Coded By    : Deepak Arora
+
+---------------------------------------------------------------*/

//#region ///   Variable Declaration   /// 
var cameraId;
var mapsWin;
var liveWin;
var fullWin;
//#endregion


/* 
* Registering the unload event of window
* Closing LiveFeed Window, Map Window and FullScreen Window  
*/
$(window).unload(function () {
    if (liveWin) { liveWin.close(); liveWin = null; }
    if (mapsWin) { mapsWin.close(); mapsWin = null; }
    if (fullWin) { fullWin.close(); fullWin = null; }
});

// Function to be called on Monitoring page. That will initializes the screens.
function loadScreens() {
    // Resize the dashboard window.
    window.resizeTo(screen.width / 2, screen.height);

    // initializes the map and video screens.
   initScreens();
}

// Initializes the Live Feed and Map Screen.
function initScreens() {
    if (!liveWin) {
        // opens the new window of live feed.
        liveWin = window.open('../Video/Index', 'livefeed', "width=" + (window.screen.width) / 2 + ", height=" + (window.screen.height) / 2 + ", top=0, left=" + (screen.width) / 2 + ", location=no, menubar=no, scrollbars=no, status=no, toolbar=no,resizable=1,copyhistory= no,fullscreen=no");
        
        // bind onload of live feed window.
        liveWin.onload = new function () { liveWin.RunCallbackFunction = liveFeedCallBack() };

        // RunCode after LiveFeed window loaded.
        $(liveWin).load(function () {
            liveFeedCallBack();
        });

        // RunCode after LiveFeed window is closed.
        $(liveWin).unload(function () {
            liveWin = null;
        });
    }
}

// Callback function of map screen load.
function mapsCallback() {
    // Assign live wind on live win load.
    if (window.focus) { mapsWin.focus(); }
        mapsWin.liveWin = liveWin;  
}

// Callback function of Live Feed screen load.
function liveFeedCallBack() {
    if (window.focus && liveWin != null ) { liveWin.focus(); }
    
    // if map widow not opened.
    if (!mapsWin) {        
        // open the map screen
        mapsWin = window.open('../Map/Index', 'maps', "width=" + (window.screen.width) / 2 + ", height=" + (window.screen.height) / 2 + ",top=" + (screen.height) / 2 + ", left=" + (screen.width) / 2 + ", location=no, menubar=no, scrollbars=no, status=no, toolbar=no,resizable=1,copyhistory= no,fullscreen=no");

        // RunCode after Maps window is loaded.
        $(mapsWin).load(function () { mapsCallback() });

        // RunCode after Maps window is closed.
        $(mapsWin).unload(function () {  mapsWin = null; });
    }
}

// Getting the live feed from camera.
function getLiveFeed(camName) {
    if (liveWin != null)
        liveWin.TurnOnCamera(camName);
}

// Getting the live feed from camera from map page.
function getMapLiveFeed(camName) {
    if (liveWin != null)
        liveWin.TurnOnCamera(camName);
}