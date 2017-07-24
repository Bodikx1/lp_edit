"use strict";

// Grab url and store query parameters

var setLegacyUrl = parseQueryString(window.location.search);
//Store vid and pid as variables
var setLegacyVid = setLegacyUrl.vid;
var setLegacyPid = setLegacyUrl.pid;
// check to see if vid and pid have values
if (setLegacyVid && setLegacyPid) {
  // set vid and pid as key-values as Cookies
  setCookie('legacyVid', setLegacyVid, 2);
  setCookie('legacyPid', setLegacyPid, 2);
} else {
  // if no vid and pid found in query parameters
  // apply default vid and pid as Cookies
  setCookie('legacyVid', '5928ab69b12c3628650061fa');
  setCookie('legacyPid', '51525977cd7d10204f000000');
}