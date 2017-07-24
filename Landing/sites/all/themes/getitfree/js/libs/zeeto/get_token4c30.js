'use strict';

/**
 * attaches productMap to window
 * @param callback
 */
var getProductMap = function getProductMap(callback) {
  $.ajax({
    url: 'https://s3.amazonaws.com/redeemable-products/product-map.json',
    type: 'GET',
    dataType: 'json',
    success: function success(data) {
      window.productMap = data;
      callback();
    },
    error: function error() {
      window.productMap = {
        'Tide': 34651
      };
      callback();
    }
  });
};
/**
 * retrieves productMap from window and builds redirect url with token
 */
var getToken = function getToken() {
  var redemptionSampleImage = path.user.attributes.redemption_sample_image;
  if (redemptionSampleImage === 'undefined' || redemptionSampleImage === 'bundle') redemptionSampleImage = undefined;
  var utmContent = path.query('uf');
  // assigns product ordered by utm_content, redemption_sample_image attr, then default
  var userProduct = utmContent || redemptionSampleImage || 'Tide';
  var userProductPostId = window.productMap[userProduct];
  /**
   * wordpress post_id of redeemable sample
   * ordered by utm_content, redemption_sample_image, then default
   * @type {Number}
   */
  var postId = userProductPostId || 34651;
  var formData = {
    first_name: path.user.attributes.first_name,
    last_name: path.user.attributes.last_name,
    street_address: path.user.attributes.address,
    city: path.user.attributes.city,
    state: path.user.attributes.state,
    zip_code: path.user.attributes.zip,
    email: path.user.attributes.email,
    post_id: postId,
    traffic_source_id: 1
  };
  /**
   * Request for call to IMA enpoint
   * @type {XMLHttpRequest}
   */
  var request = new XMLHttpRequest();

  /**
   * Callback for handling XHR state shange
   * Currently logs error, not sure if that should stay
   * uses the this keyword so it needs to be binded to a request
   */
  var handleReadyStateChange = function handleReadyStateChange() {
    var err = {};

    if (this.readyState === 4) {
      if (this.status === 200) {
        var token = JSON.parse(this.responseText).token;
        path.user.save({ token: token });
        if (token !== "undefined" || token !== undefined) {
          // Saving the redempetionToken as a cookie
          setCookie('redeemToken', token, 2);
        }
      } else {
        err = new Error('XHR Failed:: ' + this.status + ' ' + this.statusText);
        err.status = this.status;
        err.statusText = this.statusText;
        err.req = this;
        throw err;
      }
    }
  };

  /**
   * Encodes a simple object for to a x-www-form-urlencoded format String
   * @param  {Object} data a simple, 1 level, object
   * @return {String}        ready to be used as a payload in a request
   */
  var encode = function encode(data) {
    var encodedData = '';
    var key;
    for (key in data) {
      if (data.hasOwnProperty(key)) {
        encodedData += encodeURIComponent(key) + '=' + encodeURIComponent(data[key]) + '&';
      }
    }
    return encodedData;
  };

  // immediately attempt to make the request
  // Samples  Test Url: http://54.210.151.33/api/v.1.0/token/
  // HyperDev Test Url: https://calico-donkey.hyperdev.space/api/v.1.0/token/
  request.open('POST', 'https://www.samplesinventory.com/api/v.1.0/token/', true);
  request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  request.onreadystatechange = handleReadyStateChange.bind(request);
  request.send(encode(formData));
};

var appendTokenToRedirectUrl = function appendTokenToRedirectUrl() {
  // attaches product map to window and uses to fetch user token
  // attaching token to window
  getProductMap(getToken);
};