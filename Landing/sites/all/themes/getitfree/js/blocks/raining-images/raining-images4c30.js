"use strict";

(function () {

    var raining_image = document.querySelector('.js-rainingImages');
    var raining_image1_value = raining_image.dataset.rainingimage1;
    var raining_image2_value = raining_image.dataset.rainingimage2;
    var raining_image3_value = raining_image.dataset.rainingimage3;
    var raining_image4_value = raining_image.dataset.rainingimage4;
    var raining_image_cycle_value = raining_image.dataset.rainingimagecycle;
    var raining_image_speed_value = raining_image.dataset.rainingimagespeed;
    // refactor variable so it points to default link?
    var raining_image_link_value = raining_image.dataset.rainingimagelink;
    var raining_image_class_value = raining_image.dataset.rainingimageclass;
    var raining_image_append_value = raining_image.dataset.rainingimageappend;
    // Grabbing variationPageNumber and variationPageType set in variationView.js

    // let it fall! plugin for falling or "raining/snowing" images
    $.fn.letItFall = function (options) {
        var count = 0;
        // default settings
        var settings = $.extend({
            numElements: 1
        }, options);

        return this.each(function () {
            $(this).addClass('rainingImageContainer');

            // creates the randomized images that fall
            function doLetItFall() {
                for (var i = 0; i <= settings.numElements; i++) {
                    var $element = $('<a href="' + variationNextPage + '" class="' + raining_image_class_value + '">'),
                        $elementImg = $('<img />'),
                        $imgSrc = [raining_image1_value, raining_image2_value, raining_image3_value, raining_image4_value],
                        $images = $imgSrc.length,
                        $elementWrapper = $('.rainingImageContainer'),
                        $width = $elementWrapper.width(),
                        $randNum = function $randNum(num) {
                        var theNum = Math.floor(Math.random() * num);
                        return theNum;
                    },
                        $leftPos = $randNum($width) + 'px',
                        $imgSize = $randNum(100) + 'px',
                        $fallSpeed = ['normal', 'slow-fall', 'med-fall', 'fast-fall'],
                        // top to bottom
                    $elementSpeed = ['slow', 'medium', 'fast'],
                        // left to right
                    getSizeAndSpeed = function getSizeAndSpeed(getIndex) {
                        var $index = Math.floor(Math.random() * getIndex);
                        return $index;
                    };
                    $elementImg.attr({ 'src': '/' + $imgSrc[$randNum($images)], 'width': $imgSize, 'height': $imgSize }).addClass('rainingImage').addClass($elementSpeed[getSizeAndSpeed(3)]);
                    $element.addClass('rainingImage').addClass($fallSpeed[getSizeAndSpeed(4)]).append($elementImg).css({ 'width': $imgSize, 'height': $imgSize, 'left': $leftPos });
                    $element.appendTo($elementWrapper);
                }
                count++;
            }

            doLetItFall();

            // do it some more for intermittent image-falling effect
            var numTimes = setInterval(function () {
                doLetItFall();
                if (count >= 5) {
                    clearInterval(numTimes);
                }
            }, raining_image_speed_value);
        });
    };

    $(raining_image_append_value).letItFall({
        numElements: raining_image_cycle_value // number of elements per cycle
    });
})();