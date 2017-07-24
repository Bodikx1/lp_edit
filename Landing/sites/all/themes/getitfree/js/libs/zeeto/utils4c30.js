"use strict";

// set cookie

var setCookie = function setCookie(c_name, value, exdays) {
  var host = window.location.host;
  var hostArray = host.split(".");
  //default to getitfree.us as most of our domain are that
  var domain = ".getitfree.com";
  //if there is a subdomain ex) you.getitfree.us
  if (hostArray.length === 3) {
    //concatenate the strings together
    domain = "." + hostArray[1] + "." + hostArray[2].split(":")[0];
    //if there's no subdomain ex) getitfree.us
  } else if (hostArray.length === 2) {
    //concatenate the strings together
    domain = "." + hostArray[0] + "." + hostArray[1].split(":")[0];
  } else if (hostArray.length === 4) {
    //concatenates the strings together for domains with four variables (AWS staging and production)
    // Amazon URL configurations for staging and production http://blue-staging-getitfree.us-west-2.elasticbeanstalk.com
    domain = "." + hostArray[2] + "." + hostArray[3].split(":")[0];
  }

  var exdate = new Date();
  exdate.setDate(exdate.getDate() + exdays);
  var c_value = escape(value) + (exdays == null ? "" : "; expires=" + exdate.toUTCString());
  document.cookie = c_name + "=" + c_value + ';path=/;domain=' + domain;
};

// get cookie
var getCookie = function getCookie(name) {
  var re = new RegExp(name + "=([^;]+)");
  var value = re.exec(document.cookie);
  return value != null ? unescape(value[1]) : null;
};

var parseQueryString = function parseQueryString(queryString) {
  var params = {},
      queries,
      temp,
      i,
      l;

  if (!queryString.length) {
    return params;
  }

  // Remove first leading '?' then split into key/value pairs
  queries = queryString.substring(1).split("&");

  // Convert the array of strings into an object
  for (i = 0, l = queries.length; i < l; i++) {
    temp = queries[i].split('=');
    params[temp[0]] = temp[1];
  }

  return params;
};

var addPopunder = function addPopunder() {
  $(".popunder").each(function () {
    var $anchor = $(this);
    $anchor.attr("target", "_blank");
    $anchor.on("click", function () {
      setTimeout(function () {
        window.location = "https://i.getitfree.us/popunder.html?popunder=splash";
      }, 200);
    });
  });
};

//
// Smooth Scoll Function
//
$(function () {
  $('a[href*="#"]:not([href="#"])').click(function () {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      if (target.length) {
        $('html, body').animate({
          scrollTop: target.offset().top
        }, 1000);
        return false;
      }
    }
  });
});

// Sticky Footer
$(function () {
  var winHeight = function winHeight() {
    var offset = 252;
    var windowHeight = $(window).height();
    var windowHeightOffset = windowHeight - offset;
    $('.main-content').css('min-height', windowHeightOffset + 'px');
  };
  winHeight();
  $(window).resize(function () {
    winHeight();
  });
});

// function that grabs query parameter
function getAllUrlParams(url) {

  // get query string from url (optional) or window
  var queryString = url ? url.split('?')[1] : window.location.search.slice(1);

  // we'll store the parameters here
  var obj = {};

  // if query string exists
  if (queryString) {

    // stuff after # is not part of query string, so get rid of it
    queryString = queryString.split('#')[0];

    // split our query string into its component parts
    var arr = queryString.split('&');

    for (var i = 0; i < arr.length; i++) {
      // separate the keys and the values
      var a = arr[i].split('=');

      // in case params look like: list[]=thing1&list[]=thing2
      var paramNum = undefined;
      var paramName = a[0].replace(/\[\d*\]/, function (v) {
        paramNum = v.slice(1, -1);
        return '';
      });

      // set parameter value (use 'true' if empty)
      var paramValue = typeof a[1] === 'undefined' ? true : a[1];

      // (optional) keep case consistent
      paramName = paramName.toLowerCase();
      paramValue = paramValue.toLowerCase();

      // if parameter name already exists
      if (obj[paramName]) {
        // convert value to array (if still string)
        if (typeof obj[paramName] === 'string') {
          obj[paramName] = [obj[paramName]];
        }
        // if no array index number specified...
        if (typeof paramNum === 'undefined') {
          // put the value on the end of the array
          obj[paramName].push(paramValue);
        }
        // if array index number specified...
        else {
            // put the value at that index number
            obj[paramName][paramNum] = paramValue;
          }
      }
      // if param name doesn't exist yet, set it
      else {
          obj[paramName] = paramValue;
        }
    }
  }

  return obj;
}