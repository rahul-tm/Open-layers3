$(window).load(function () {
    $('input#UserName', 'div#loginform').focus();
});

/*
* This function show the forgot password window.
*/
function forgotpassword() {
    $('#n-container').hide();
    $('#forgotContainer').show();
    $('#forgotEmail').val('').focus();
    return false;
}

/*
* When user click on cancel button of forgot password panel.
*/
function cancelForgotPwd() {
    $('#n-container').show();
    $('#forgotContainer').hide();
    $('input#UserName', 'div#loginform').focus();
    return false;
}

/*
* Function to validate email using regular expression.
*/
function isValidEmail(e) {
    var filter = /^\s*[\w\-\+_]+(\.[\w\-\+_]+)*\@[\w\-\+_]+\.[\w\-\+_]+(\.[\w\-\+_]+)*\s*$/;
    return String(e).search(filter) != -1;
}

/*
* This function is used to get the user password.
*/
function getPassword() {
    var email = $.trim($('#forgotEmail').val());
    showMessage({ 'msg': "Loading...", 'autoClose': false, 'className': 'success' });
    if (isValidEmail(email)) {
        $.ajax({
            url: "/Account/ForgotPassword?mailId=" + email,
            cache: false,
            success: function (data, textStatus, jqXHR) {
                if (data == "success")
                    showMessage({ 'msg': "New password has been sent to your mail id.", 'autoClose': true, 'className': 'success' });
                else
                    showMessage({ 'msg': "Some problem occured on server. Check email id exist or not.", 'autoClose': true, 'className': 'fail' });
            },
            error: function (jqXHR, textStatus, errorThrown) {
                showMessage({ 'msg': "Some problem occured on server. Check email id exist or not.", 'autoClose': true, 'className': 'fail' });
                if (typeof ('console') != 'undefined') {
                    console.dir(jqXHR);
                    //console.log("\n\n-----jqxhr-------\n" + jqXHR);
                }
            },
            complete: function (jqXHR, textStatus, errorThrown) {
                //closeMessage();
            }
        });
    }
    else {
        showMessage({ 'msg': 'Invalid Email Id. Try again.', 'autoClose': true, 'className': 'fail' });
    }
}


/*
* This function is used to get the user password.
*/
function changePassword() {
    var email = $.trim($('#forgotEmail').val());
    if (isValidEmail(email)) {
        $.ajax({
            url: "/Account/ChangePassword",
            type : "post",
            data : $('#frmChangePwd').serialize(),
            cache: false,
            success: function (data, textStatus, jqXHR) {
                if (data == true)
                    showMessage({ 'msg': "New password has been sent to your mail id.", 'autoClose': true, 'className': 'success' });
                else
                    showMessage({ 'msg': data, 'autoClose': true, 'className': 'fail' });
            },
            error: function (jqXHR, textStatus, errorThrown) {
                if (typeof ('console') != 'undefined') {
                    console.log(textStatus);
                    console.log("\n\n-----jqxhr-------\n" + jqXHR);
                }
            }
        });
    }
    else {
        showMessage({ 'msg': 'Invalid Email Id. Try again.', 'autoClose': false, 'className': 'fail' });
    }
}