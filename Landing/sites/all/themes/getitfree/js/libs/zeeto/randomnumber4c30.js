'use strict';

$(document).ready(function () {
    jQuery.each(jQuery('.random-number'), function () {
        var number = Math.floor(Math.random() * 200 + 1);
        jQuery(this).text(number);
    });
});