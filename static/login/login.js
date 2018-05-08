'use strict';
$(function () {
    $('#submit').click(function() {
        $.ajax({
            method: 'POST',
            url: '/user/login',
            contentType: 'application/json; charset=utf-8',
            dataType: 'text',
            data: JSON.stringify({
                username: $('#username').val(),
                password: $('#password').val(),
            }),
            success: function(data, status) {
                localStorage.setItem('token', data);
                window.location.href = "/dashboard";
            }
        });
    });
});