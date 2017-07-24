"use strict";
// Set path options
// Grabbing variationPageNumber and variationPageType set in variationView.js

var pathOptions = {
  id: getCookie("legacyPid"),
  page: variationPageType,
  pageNumber: variationPageNumber,
  variationId: getCookie("legacyVid")
};
window.path = new window.Path(pathOptions);
path.start();