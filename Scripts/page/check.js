/*
* Filename : check.js
* Purpose : Checking the compatability of browser settings and plugins to run application.
*/  //doubt

var rValue = -1;
var configure = 0;
checkComatability();

/*
* Checkes the browser compatibility and ActiveX Plugin check.
*/
function checkComatability() {
    // checking Browser                 
    if (navigator.appName == "Microsoft Internet Explorer") {
        document.getElementById('browsercheck').innerHTML = 'Your current Web Browser is supported.';
        document.getElementById('img_browser').src = '../../Content/css/images/found.png';
        rValue = 1;

        // Check for ActiveX is installed or not.
        checkActiveX();
    }
    else {
        document.getElementById('plugin_installer').innerHTML = "";
        document.getElementById('browsercheck').innerHTML = 'This web application is only supported in Microsoft Internet Explorer';
        document.getElementById('img_browser').src = '../../Content/css/images/notfound.png';
    }
}

/* Checking if ActiveX Control is installed in your system.
*  If not it will show download link.
*/
function checkActiveX() {
    try {
        var tester = null;

        tester = new ActiveXObject("VMS_TempClient.Web_MediaPlayer");
    }
    catch (e) {
        document.getElementById('plugin_installer').style.display = "block";
        document.getElementById('activexcheck').innerHTML = 'Required Plugin is not installed on your system or<br/> Internet Explorer is not confirugure properly for ActiveX.&nbsp;';

        if (configure == 0) {
            document.getElementById('activexcheck').innerHTML += '<label style=\"color:#5896DA;text-decoration:underline;cursor:pointer;\" onclick=\"showActiveXHelp();\" id=\"configure\">configure</label>';
        } else {
            document.getElementById('activexcheck').innerHTML += '<label style=\"color:#5896DA;text-decoration:underline;cursor:pointer;\" onclick=\"hideActiveXHelp();\" id=\"configure\">hide</label>';
        }

        document.getElementById('img_plugin_installer').style.display = "block";
        document.getElementById('activexcheck').style.display = "block";
        document.getElementById('img_axcontrol').style.display = "block";

        var t = setTimeout("checkActiveX()", 2000);
        document.getElementById('img_axcontrol').src = '../../Content/css/images/notfound.png';
    }
    if (tester) {
        document.getElementById('activexcheck').innerHTML = 'Required Plugin is installed on your system.';
        document.getElementById('activexhelp').innerHTML = '';
        document.getElementById('img_axcontrol').src = '../../Content/css/images/found.png';
        document.getElementById('plugin_installer').innerHTML = "";

        if (rValue == 1) {
            document.getElementById('plugin_installer').innerHTML = "Redirecting you to your home page now.";
            setTimeout(function () { window.location = "/Account/LogOn" }, 2000);
        }
    }
}

/*
* * ActiveX message show.
*/
function showActiveXHelp() {
    document.getElementById('configure').style.display = 'none';
    document.getElementById('activexhelp').style.display = 'block';
    document.getElementById('activexcheck').innerHTML += '<label style=\"color:#5896DA;text-decoration:underline;cursor:pointer;\" onclick=\"hideActiveXHelp();\" id="hide">hide</label>';
    configure = 1;
    return false;
}

/*
* ActiveX message hide.
*/
function hideActiveXHelp() {   
    document.getElementById('configure').style.display = 'none';
    document.getElementById('activexhelp').style.display = 'none';
    document.getElementById('activexcheck').innerHTML += '<label style=\"color:#5896DA;text-decoration:underline;cursor:pointer;\" onclick=\"showActiveXHelp();\" id="configure">configure</label>';
    configure = 0;
}