'use strict';
$(function () {
    $('.form-signin').submit(function() {
        $.ajax({
            method: 'POST',
            url: '/user/login',
            contentType: 'application/json; charset=utf-8',
            dataType: 'text',
            data: JSON.stringify({
                username: $('#inputUsername').val(),
                password: $('#inputPassword').val(),
            }),
            success: function(data, status) {
                localStorage.setItem('token', data);
                window.location.href = "/dashboard";
            }
        });
        return false;
    });
});