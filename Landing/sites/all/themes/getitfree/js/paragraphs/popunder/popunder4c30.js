'use strict';

var isMobile = Boolean(navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|PlayBook/i));
if (BrowserDetect.browser !== 'Explorer' && isMobile === false) {
  popUnder();
}

function popUnder() {
  $(".popunder").each(function () {
    var popunderUrl = document.querySelector('.js-popunder');
    var popunderUrl_value = popunderUrl.dataset.popunderurl;
    var $anchor = $(this);
    $anchor.attr("target", "_blank");
    $anchor.on("click", function () {
      setTimeout(function () {
        window.location = popunderUrl_value;
      }, 1000);
    });
  });
}