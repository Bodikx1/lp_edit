'use strict';

// Grabbing data attributes set in variation view
var variationView = document.querySelector('.js-variation-view');
var variationNextPage = variationView.dataset.nextpage;
var variationPageType = variationView.dataset.pagetype;
var variationPageNumber = variationView.dataset.pagenumber;

var linkQueryParameter = document.querySelectorAll('.js-nextpage-uf');
for (var i = 0; i < linkQueryParameter.length; i++) {
  var attrSelect = linkQueryParameter[i].getAttribute("href");
  // Grabs inputted utm_content value from Drupal Sample Content Type {{ field.utm_content }}
  var caseSensitiveUf = attrSelect.split('uf=')[1];
  // Builds url and appends dynamic image value selected
  linkQueryParameter[i].href = variationNextPage + '?uf=' + caseSensitiveUf;
}
var link = document.querySelectorAll('.js-nextpage');
for (var i = 0; i < link.length; i++) {
  link[i].setAttribute("href", variationNextPage);
}