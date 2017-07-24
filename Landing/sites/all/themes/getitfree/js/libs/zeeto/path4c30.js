'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * @filename path-impicit-coreg-impression.js
 * @file Manages the persistence of sessions, user data, and offers for a path.
 * @author Dan Carr <dan.carr@zeetogroup.com>
 * @updated Brittan McGinnis <brittan.m@zeetogroup.com>
 * @summary Fires implicit offer impression for reporting line 812
 *          This file was modified to use the coreg proxy endpoint 8/19/15
 */

/**
 * Main functions
 * @namespace PathJS
 */

var $ = jQuery;

var main = function () {
  var jsonpCount = 0,
      doc = document,
      head = doc.getElementsByTagName('head')[0],
      noop = function noop() {};

  /**
   * Returns true if argument is an array.
   * @memberOf PathJS
   *
   * @param {object} array Accepts an object to test if its an array.
   *
   * @returns {boolean}
   */
  function isArray(array) {
    return Object.prototype.toString.call(array) === "[object Array]";
  }

  /**
   * Builds query string from data object.
   * @memberOf PathJS
   *
   * @param {object} data A data object that contains query params.
   *
   * @returns {string} A query string.
   */
  function buildQuery(data) {
    var value,
        tmp = [];

    var build = function build(property, val) {
      var tmp = [];

      if (!val) {
        return '';
      }

      if ('object' === (typeof val === 'undefined' ? 'undefined' : _typeof(val))) {
        for (var p in val) {
          if (val.hasOwnProperty(p) && val[p]) {
            tmp.push(build(property + '[' + encodeURIComponent(p) + ']', val[p]));
          }
        }

        return tmp.join('&');
      }

      return property + '=' + encodeURIComponent(val);
    };

    for (var property in data) {
      if (data.hasOwnProperty(property)) {
        value = data[property];
        var query = build(property, value);
        if ('' !== query) {
          tmp.push(query);
        }
      }
    }

    return tmp.join('&');
  }

  /**
   * Handle the response.
   * @memberOf PathJS
   *
   * @param {object} path
   * @param {object} response
   * @param {function} callback
   */
  function handleResponse(path, response, callback) {
    if (response['session_id']) {
      if (path.session.id != response['session_id']) {
        path.session.id = response['session_id'];
        path.cookies.set('sid', response['session_id'], { expires: 90 });
      }
    }

    if (response['session'] && 'object' === _typeof(response['session'])) {
      for (var key in response['session']) {
        if (response['session'].hasOwnProperty(key) && 'id' !== key) {
          path.session[key] = response['session'][key];
        }
      }
    }

    if (response['uuid']) {
      path.uuid = response['uuid'];
      path.cookies.set('uuid', response['uuid'], { expires: 90 });
    }

    if (response['user_id']) {
      path.cookies.set('vid', response['user_id'], { expires: 90 });
    }

    if (response['cpa_pixel'] && isArray(response['cpa_pixel']) && response['cpa_pixel'].length > 0) {
      var url = path.options.api.baseUrl + 'cpa-pixel/' + path.session.id,
          pixelFrame = doc.createElement('iframe');

      pixelFrame.setAttribute('src', url + '?' + buildQuery({ campaigns: response['cpa_pixel'] }));
      pixelFrame.width = '1px';
      pixelFrame.height = '1px';
      pixelFrame.style.border = '0px';
      pixelFrame.frameborder = 0;
      doc.body.appendChild(pixelFrame);
    }

    if (callback) {
      callback(response);
    }
  }

  /**
   * The User constructor
   * @class User
   * @namespace User
   * @param {object} path An object of properties to be sent to PM.
   *
   * @constructor
   */
  function User(path) {
    this.path = path;
    this.attributes = {};
  }

  /**
   * Fetch a user.
   * @memberOf User
   * @param {function} callback
   */
  User.prototype.fetch = function (callback) {
    var self = this,
        endpoint;

    this.path.queue(function () {
      endpoint = self.path.options.api.baseUrl + 'sessions/' + self.path.session.id + '/user';
      self.path.jsonp(endpoint, function (response) {
        handleResponse(self.path, response, function () {
          if (response.user) {
            self.setAttributes(response.user);
            callback(false, self);
          } else {
            callback(true);
          }
        });
      });
    });
  };

  /**
   * Save a user.
   * @memberOf User
   *
   * @param {object} attributes An object of properties to be sent to PM.
   * @param {function} callback
   */
  User.prototype.save = function (attributes, callback) {
    var self = this,
        url;

    callback = callback || noop;

    if ('object' !== (typeof attributes === 'undefined' ? 'undefined' : _typeof(attributes))) {
      throw new Error('Invalid attributes given.');
    }

    if (callback && 'function' !== typeof callback) {
      throw new Error('Invalid callback given.');
    }

    var query = buildQuery(this.sanitize(attributes));
    if ('' === query) {
      return;
    }

    url = this.path.options.api.baseUrl + 'sessions/' + this.path.session.id + '/user?' + query;

    this.path.queue(function () {
      self.path.jsonp(url, function (response) {
        handleResponse(self.path, response, function () {
          if (response.user) {
            self.setAttributes(response.user);
            callback(false, self);
          } else {
            callback(response.errors instanceof Array || {});
          }
        });
      });
    });
  };

  /**
   * Sanitize user attributes
   * @param  {object} attributes raw user attributes collected from input
   * @return {object} sanitized user attributes
   */
  User.prototype.sanitize = function (attributes) {
    /**
     * Checks if key is type string, runs replace, if type is object, recursively call itself
     * @param  {object} obj user parameters object
     * @return {object} cleansed user object
     */
    var clean = function clean(obj) {
      var key;
      for (key in obj) {
        // use hasOwnProperty to avoid checking against prototype parameters
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === 'string') {
            // if type is string, run replace
            obj[key] = obj[key].replace(/([+]).{0}/g, ' ').replace(/([;?<>^*%!=&\\|]).{0}/g, '');
          } else if (_typeof(obj[key]) === 'object' && obj[key] !== null) {
            // if type is object, recursively call clean method
            obj[key] = clean(obj[key]);
          }
        }
      }
      return obj;
    };
    // call clean method for user attributes object
    return clean(attributes);
  };

  /**
   * Get a user.
   * @memberOf User
   *
   * @param {object} attribute User attributes like dob, zip code, email, etc.
   * @param def
   *
   * @returns {*}
   */
  User.prototype.get = function (attribute, def) {
    def = def || '';

    return this.attributes[attribute] ? this.attributes[attribute] : def;
  };

  /**
   * Sets visitor's attributes.
   * @memberOf User
   *
   * @param {object} attributes
   */
  User.prototype.setAttributes = function (attributes) {
    if (attributes.date_of_birth) {
      var DateOfBirth = function DateOfBirth(date) {
        this.day = date.getUTCDate();
        this.month = parseInt(date.getUTCMonth()) + 1;
        this.year = date.getUTCFullYear();
        this.date = date;
      };

      DateOfBirth.prototype.toString = function (separator) {
        separator = separator || '-';

        return this.year + separator + this.month + separator + this.day;
      };

      attributes.date_of_birth = new DateOfBirth(new Date(attributes.date_of_birth * 1000));
    }

    this.attributes = attributes || {};
  };

  /**
   * The Path constructor.
   * @class Path
   * @namespace Path
   *
   * @param {object} options
   *
   * @constructor
   */
  function Path(options) {
    this.options = {
      id: false,
      variationId: false,
      trackInitialPageView: true,
      pageNumber: 1,
      page: false,
      api: {
        baseUrl: 'https://zadsy.com/',
        surveyBaseUrl: '',
        defaultSurveyBaseUrl: 'https://coreg.zadsy.com/'
      }
    };

    this.uuid = undefined;
    this.session = {};
    this.user = new User(this);
    this.ready = false;

    for (var property in options || {}) {
      if (this.options.hasOwnProperty(property)) {
        this.options[property] = options[property];
      }
    }

    if (!this.options.id || !this.options.variationId) {
      throw new Error('The "id" and "variationId" option must be set.');
    }

    window.___Z_PATH___ = this;
  }

  /**
   * Initializes the session object.
   * @memberOf Path
   *
   * @param callback
   */
  Path.prototype.start = function (callback) {
    var self = this,
        oldCallback = callback || noop,
        params = { pid: this.options.id, vid: this.options.variationId };

    var source = this.query('utm_source');
    var campaign = this.query('utm_campaign');
    var content = this.query('utm_content');
    var medium = this.query('utm_medium');
    var term = this.query('utm_term');

    if (source) {
      params.utm_source = source;
    }

    if (campaign) {
      params.utm_campaign = campaign;
    }

    if (content) {
      params.utm_content = content;
    }

    if (medium) {
      params.utm_medium = medium;
    }

    if (medium) {
      params.utm_term = term;
    }

    callback = function callback() {
      if (self.options.trackInitialPageView) {
        self.trackPageView();
      }

      self.ready = true;

      oldCallback();
    };

    var sid = this.query('sid');
    if (sid) {
      self.session.id = sid;
      self.cookies.set('sid', sid, { expires: 90 });
    } else {
      this.session.id = this.cookies.get('sid');
    }

    var uuid = this.query('uuid');
    if (uuid) {
      this.uuid = uuid;
      this.cookies.set('uuid', uuid, { expires: 90 });
    } else {
      this.uuid = this.cookies.get('uuid');
    }

    this.pixels();

    if (this.session.id) {
      if (self.options.api.surveyBaseUrl === '') {
        self.getCoregUrl(callback);
      } else {
        callback();
      }
      return;
    }

    this.jsonp(this.options.api.baseUrl + 'sessions?' + buildQuery(params), function (response) {
      handleResponse(self, response, function () {
        if (self.options.api.surveyBaseUrl === '') {
          self.getCoregUrl(callback);
        } else {
          callback();
        }
      });
    });
  };

  /**
   * Fetch the url for coreg and set survey base
   * @param callback
   */
  Path.prototype.getCoregUrl = function (callback) {
    var self = this;

    if (self.options.api.defaultSurveyBaseUrl != '') {
      var coregUrl = self.options.api.defaultSurveyBaseUrl + 'sessions/' + self.session.id + '/variation';

      this.jsonp(coregUrl, function (response) {
        handleResponse(self, response, function () {
          self.session.rid = response.variation_id;
          var host = response.variation_hostname;
          // checks for trailing slash in host then sets value
          self.options.api.surveyBaseUrl = host.substr(host.length - 1) === '/' ? host : host + '/';
          callback();
        });
      });
    } else {
      // coreg model does not exist, skip calling out for the correct coreg endpoint
      callback();
    }
  };

  /**
   * Tracks an Event
   * @memberOf Path
   *
   * @param event
   * @param data
   * @param {function} callback
   */
  Path.prototype.trackEvent = function (event, data, callback) {
    var self = this;
    callback = callback || noop;

    if (!event || '' === event) {
      return;
    }

    var queryData = { event: event };

    if ('object' == (typeof data === 'undefined' ? 'undefined' : _typeof(data))) {
      queryData.data = data;
    }

    this.queue(function () {
      self.jsonp(self.options.api.baseUrl + 'sessions/' + self.session.id + '/events?' + buildQuery(queryData), function (response) {
        handleResponse(self, response, function () {
          if ('function' === typeof callback) {
            callback(response);
          }
        });
      });
    });
  };

  /**
   * Tracks a page view.
   * @memberOf Path
   *
   * @param pageNumber
   * @param {function} callback
   */
  Path.prototype.trackPageView = function (pageNumber, callback) {
    this.trackEvent('path_impression', { 'page_number': pageNumber || this.options.pageNumber }, callback);
  };

  /**
   * Tracks a creative skip.
   * @memberOf Path
   *
   * @param impressionId
   * @param {function} callback
   */
  Path.prototype.trackCreativeSkip = function (impressionId, callback) {
    if (impressionId) {
      this.trackEvent('creative_skip', { impression_id: impressionId }, callback);
    }
  };

  /**
   * Gets a creative.
   * @memberOf Path
   *
   * @param {number} id
   * @param {function} callback
   * @param {boolean} preview
   */
  Path.prototype.creative = function (id, callback, preview) {
    var self = this,
        url;
    callback = callback || noop;
    url = this.options.api.baseUrl + (true !== preview ? 'creative/' : 'creative-preview/');
    this.queue(function () {
      self.jsonp(url + id, function (response) {
        handleResponse(self, response, function () {
          if (response.creative) {
            callback(false, response);
          } else {
            callback(true);
          }
        });
      });
    });
  };

  /**
   * Gets the session's offers.
   * @memberOf Path
   *
   * @param {function} callback
   */
  Path.prototype.offers = function (callback) {
    var self = this;
    callback = callback || noop;
    this.queue(function () {
      self.jsonp(self.options.api.baseUrl + 'sessions/' + self.session.id + '/linkouts', function (response) {
        handleResponse(self, response, function () {
          if (response.matches instanceof Array) {
            callback(false, response.matches);
          } else {
            callback(true);
          }
        });
      });
    });
  };

  /**
   * Checks if the user wins the promo.     * @memberOf Path
   *
   * @param gameId
   * @param {function} callback
   */
  Path.prototype.promo = function (gameId, callback) {
    var self = this;
    if (!gameId || !callback) {
      throw new Error('GameID and Callback are required.');
    }

    this.queue(function () {
      self.jsonp(self.options.api.baseUrl + 'sessions/' + self.session.id + '/promo?gameId=' + gameId, function (response) {
        handleResponse(self, response, function () {
          if (!response.result) {
            callback(new Error('Invalid response from API.'));
          } else {
            // will return 'is_winner' = true or false.
            callback(false, response.result);
          }
        });
      });
    });
  };

  /**
   * Appends the pixel iframe to the dom when the session is ready.
   * @memberOf Path
   */
  Path.prototype.pixels = function () {
    var path = this;

    if (path.options.page) {
      this.queue(function () {
        var url = path.options.api.baseUrl + 'sessions/' + path.session.id + '/pixels?page=' + path.options.page,
            iframe = doc.createElement('iframe');

        iframe.setAttribute('src', url);
        iframe.width = '0';
        iframe.height = '0';
        iframe.style.display = 'none';
        iframe.frameborder = 0;

        doc.body.appendChild(iframe);
      });
    }
  };

  /**
   * Handles JSONp requests by creating a script element and executing a given callback.
   * @memberOf Path
   */
  Path.prototype.jsonp = function (url, callback) {
    var name = 'Path' + new Date().getTime() + '_' + jsonpCount,
        script = doc.createElement('script');

    callback = callback || noop;

    url += /\?/.test(url) ? '&' : '?';
    script.type = 'text/javascript';
    script.src = url + 'callback=' + name;
    window[name] = function (response) {
      callback(response);
      head.removeChild(script);
    };
    head.appendChild(script);

    jsonpCount++;

    return name;
  };

  /**
   * Waits for the Path to be ready before executing callbacks.
   * @memberOf Path
   */
  Path.prototype.queue = function () {
    var queue = [],
        interval = false;

    return function (callback) {
      var self = this;

      if ('function' !== typeof callback) {
        throw new Error('Invalid callback given.');
      }

      if (this.ready) {
        callback();

        return;
      }

      queue.push(callback);
      if (false === interval) {
        interval = setInterval(function () {
          if (self.ready) {
            for (var i = 0; i < queue.length; i++) {
              queue[i].call();
            }
            queue = [];
            clearInterval(interval);
          }
        }, 1000);
      }
    };
  }();

  /**
   * Manipulate Cookies. This method is partially taken
   * from http://quirksmode.org/js/cookies.html.
   * @memberOf Path
   */
  Path.prototype.cookies = function () {
    var decode, getCookie;

    // gets a cookie (or all cookies if key is left null)
    getCookie = function getCookie(key) {
      var results = key ? null : {},
          ca = document.cookie.split('; '),
          cookie,
          name,
          parts,
          value;

      for (var i = 0; i < ca.length; i++) {
        cookie = ca[i];
        parts = cookie.split('=');
        name = parts.shift();
        value = parts.join('=');
        if (key && key === name) {
          return decode(value);
        }
        if (!key) {
          results[name] = decode(value);
        }
      }

      return results;
    };

    // decodes a cookie's value
    decode = function decode(value) {
      if (0 === value.indexOf('"')) {
        value = value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      }
      return value;
    };

    return {
      /**
       * Sets a cookie.
       */
      set: function set(key, value, options) {
        var cookieString, days, t;

        options = options || {};

        if ('number' === typeof options.expires) {
          days = options.expires;
          t = options.expires = new Date();
          t.setDate(t.getDate() + days);
        }

        cookieString = encodeURIComponent(key) + '=' + encodeURIComponent(value) + '; path=/';
        if (options.expires) {
          cookieString += '; expires=' + options.expires.toUTCString();
        }

        document.cookie = cookieString;

        return true;
      },
      /**
       * Gets a cookie.
       */
      get: function get(key) {
        return getCookie(key);
      },
      /**
       * Gets all cookies.
       */
      all: function all() {
        return getCookie();
      },
      /**
       * Expires a cookie.
       */
      remove: function remove(key) {
        return this.set(key, '', -1);
      }
    };
  }();

  /**
   * Gets query param.
   * @memberOf Path
   */
  Path.prototype.query = function (key, def) {
    key = key.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + key + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.search);

    if (results) {
      return decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    return def || null;
  };

  window.Path = Path;
}.call(undefined);

/**
 * Survey javascript PathJS that fetches questions, displays, and matches to offers.
 */
var survey = function ($, window, document, undefined) {
  var path;

  /**
   * Initialization of survey process.
   * @function init
   * @memberOf PathJS
   */
  function init() {
    bindQuestionChangeEvents.call(this);
    showNext.call(this);
  }

  function loadNextQuestion() {
    showNext.call(this, false);
  }

  function showNext(andShow) {
    var self = this;

    if (typeof andShow === 'undefined') {
      andShow = true;
    }

    getSurvey.call(this, function (err, survey, questions, offers) {
      if (!survey) {
        self.survey = undefined;
        self.questions = undefined;
        self.offers = undefined;
      } else {
        self.survey = survey;
        self.questions = questions;
        self.offers = offers;

        if (andShow) {
          self.next();
        }
      }
    });
  }

  /**
   * Previews a coreg creative.
   * @function initPreview
   * @param creativeId
   * @memberOf PathJS
   */
  function initPreview(creativeId) {
    var self = this;

    var survey = {
      currentQuestionNumber: 1,
      survey: { questions: ['fake-value-to-get-a-count-of-1'] }
    };

    self.$element.trigger('survey.next', survey);

    var url = path.options.api.baseUrl + 'sessions/previews/coreg/' + creativeId;
    path.jsonp(url, function (response) {
      if (response.html) {
        var $offerContainer = $('<div id="path-survey-offer-container" />').hide().html(response.html).appendTo(self.$container).show();

        var $form = $offerContainer.find('form');
        $form.on('change', ':input[data-optin]', function () {
          alert('Notice: This is just a preview of this creative.');
        });

        $form.on('change', ':input[data-optout]', function () {
          alert('Notice: This is just a preview of this creative.');
        });
      }
    });
  }

  /**
   * Binds question change events
   * @memberOf PathJS
   */
  function bindQuestionChangeEvents() {
    var self = this;

    this.$container.on('change', 'li.path-answer input', function () {
      var $this = $(this),
          questionId = $this.attr('name'),
          answerId = $this.val(),
          position = $this.data('position');

      if (position) {
        position = parseInt(position);
      }

      var offer = getOfferIfMatch.call(self, answerId);

      // add the offer id to payload for next api call
      if (offer) {
        self.shownOffers[offer.id] = true;
      }

      //get implicit offer for answer ID
      var implicitOffers = getImplicitOffers.call(self, answerId);

      // add the implicit offer to payload for next api call & fire implicit conversions
      if (implicitOffers) {

        // loop to implicit offer object to grab all implicit offers
        for (var index in implicitOffers) {
          var implicitOfferId = implicitOffers[index];

          // check if offer id is standard 24-character string
          if (implicitOfferId.length == 24) {

            // add to shownOffers array for next question payload
            self.shownOffers[implicitOfferId] = true;
          }

          // fire off implicit offer impression for reporting
          saveOfferEvent.call(self, questionId, answerId, implicitOfferId, false, 'impression');

          // fire off implicit offer conversion
          saveOfferEvent.call(self, questionId, answerId, implicitOfferId, false, 'conversion');
        }
      }

      self.answer(questionId, answerId, position);

      self.$currentQuestion.fadeOut(function () {
        $(this).remove();

        if (offer) {
          showOffer.call(self, offer, questionId, answerId);
        } else {
          self.next();
        }
      });

      loadNextQuestion.call(self);
    });
  }

  /**
   * Sorts all offers for a given answer by the priority key.
   * @memberOf PathJS
   * @param answerId
   * @returns {Array}
   */

  /**
   * Shuffles an array.
   * @memberOf PathJS
   * @param array
   * @returns {*}
   */
  function getSurvey(callback) {

    getNextQuestion.call(this, callback);
  }

  var answers = [];
  var offers = [];
  var emptyBodyParams = {};

  function getBodyParams() {
    if (!this.shownAnswers.length) {
      return emptyBodyParams;
    }

    // sequential list of answer objects & offer ids
    var params = { 'answers': [], 'offers': [] };

    // push all shown question objects in sequential order
    for (var i = 0; i < this.shownAnswers.length; i++) {
      params.answers.push({ 'aid': this.shownAnswers[i].aid, 't': this.shownAnswers[i].t });
    }

    // push all offer ids
    for (var id in this.shownOffers) {
      params.offers.push(id);
    }

    return params;
  }

  // gets the next question
  function getNextQuestion(callback) {
    var self = this;
    var optimizedSurveyPort = this.options.optimizedSurvey || false;
    var defaultId = '54b01557c28782ab65008e5b'; //this.options.id;

    self.loadingNext = true;

    var url = path.options.api.baseUrl + 'sessions/' + path.session.id + '/events?event=survey_visitor&data[survey_id]=54b01557c28782ab65008e5b';

    // Fire 1 time call survey_visitor for PM
    path.queue(function () {
      path.jsonp(url, function (response) {});
    });

    path.queue(function () {
      var url = path.options.api.surveyBaseUrl + 'sessions/' + path.session.id + '/surveys?v=2&rid=' + path.session.rid;
      if (defaultId) {
        url += '&id=' + defaultId;
      }

      if (optimizedSurveyPort) {
        url += '&optimized_survey=' + optimizedSurveyPort;
      }

      url += '&p=' + encodeURIComponent(JSON.stringify(getBodyParams.call(self)));

      path.jsonp(url, function (response) {
        // TODO: Add a check to see if we got questions back, if not handle
        self.loadingNext = false;

        // check if the coreg model responds with an error
        if (response.survey && response.status === 200) {
          callback(null, response.survey.tree, response.survey.questions, response.survey.offers);
        } else {
          // track GA event for failed coreg model
          coregModelUnavailable(response.status);
          callback(new Error('Survey not found'));
        }
      });
    });
  }

  function getOfferIfMatch(answerId) {
    var offerKey = this.survey && this.survey.offer_key ? this.survey.offer_key : false;

    if (!offerKey) {
      return false;
    }

    var matched = this.offers[offerKey[answerId]];

    if (!matched || this.shownOffers[matched.id]) {
      return false;
    }

    return matched;
  }

  /**
   * Grabs the implicit offer based on survey answer
   * @memberOf PathJS
   *
   * @param answerId
   *
   * @returns {object}
   */
  function getImplicitOffers(answerId) {
    var offerKey = this.survey && this.survey.implicit_offers ? this.survey.implicit_offers : false;

    if (!offerKey) {
      return false;
    }

    var matchedImplicit = offerKey[answerId];

    if (!matchedImplicit || this.shownOffers[matchedImplicit.id]) {
      return false;
    }

    return matchedImplicit;
  }

  // checks if the question & answer have an offer and tries to find a match.
  // returns true if an offer was shown, false otherwise.
  function showOffer(offer, questionId, answerId) {
    if (!offer.creative) {
      ga('send', 'event', 'Coreg', 'Coreg Error: Creative Missing', 'Offer id: ' + offer.id);
      this.next();
      return false;
    }

    $('#path-survey-offer-container').remove();

    var self = this;
    var $offerContainer;
    var $form;

    self.shownOffers[offer.id] = true;

    // modify id to match LeadiD requirements
    offer.creative.html = offer.creative.html.replace(/tcpa-phone/g, "leadid_tcpa_disclosure");

    $offerContainer = $('<div id="path-survey-offer-container" />').hide().html(offer.creative.html).appendTo(self.$container);

    var isTCPA = Boolean($("#leadid_tcpa_disclosure").length);

    // additional changes only if TCPA opt in for LeadiD
    if (isTCPA) {
      // wrap the p tag (parent) of the phone input box with label
      $("#leadid_tcpa_disclosure").parent().wrapAll('<label for="leadid_tcpa_disclosure" style="font-weight:normal"></label>');

      // add required hidden field
      $('#path-survey-offer-container form').append('<input id="leadid_token" name="universal_leadid" type="hidden" value=""/>');
    }

    $('.path-question-container').hide();

    $offerContainer.slideDown(function () {
      saveOfferEvent.call(self, questionId, answerId, offer.id, offer.creative.id, 'impression');
      callTrustedForm();
    });

    $form = $offerContainer.find('form');

    // turn off submit on "Enter" key and calls blurTCPA()
    $form.bind('keypress', function (e) {
      if (e.keyCode === 13) {
        e.preventDefault();
        blurTCPA();
      }
    });

    // when input with "data-optin" attribute changes, submit the coreg offer and move to
    // next question
    $form.on('change', ':input[data-optin]', function () {
      self.$element.trigger('coreg:optin');

      if ('undefined' === typeof offer.creative) {
        // do nothing
      } else {
        if (!$('#leadid_tcpa_disclosure').length) {
          nextOffer(self, offer, questionId, answerId);
        } else {
          validatePhone(self, offer, questionId, answerId);
        }
      }
    });

    // when an input with a "data-optout" attribute changes, close offer container and go to
    // next question.
    $form.on('change', ':input[data-optout]', function () {
      if ('undefined' === typeof offer.creative) {
        // do nothing
      } else {
        $('div#path-survey-offer-container').slideUp(function () {
          $(this).remove();
          self.next();
        });
      }
    });

    return true;
  }

  /**
   * Verifies 12 digit phone exists on 'Yes' opt-in click
   *
   * @param {object} survey - Survey instance
   * @param {object} offer - Survey offer instance
   * @param {string} questionId - ID of the current question.
   * @param {string} answerId - ID of the selected answer.
   */

  function validatePhone(survey, offer, questionId, answerId) {
    var self = survey;
    var $offerContainer = $('div#path-survey-offer-container');
    var $coregForm = $offerContainer.find('form');
    var params = {};
    var isTCPA = Boolean($("#leadid_tcpa_disclosure").length);
    if ($('#leadid_tcpa_disclosure').val().length === 12) {
      // if trusted form exists in coreg form, get the URL
      var $trustedForm = $coregForm.find('input[name="xxTrustedFormCertUrl"]');
      if ($trustedForm && $trustedForm.length) {
        params.xxTrustedFormCertUrl = $trustedForm.val();
      }
      // sanitize mobile_phone to eliminate all non-digit characters from number
      var mobilePhone = $("#leadid_tcpa_disclosure").val();
      var sanitizedMobilePhone = mobilePhone.replace(/[^\d]/g, '');

      path.user.save({ mobile_phone: sanitizedMobilePhone }, function () {
        // take snapshot on opt-in for LeadiD
        if (isTCPA) {
          LeadiD.formcapture.init();
        }
        nextOffer(survey, offer, questionId, answerId);
      });
    }
    // each time 'Yes' opt-in is clicked,
    // validate 12 digit phone exists before proceeding
    $('input[data-optin]').on('click', function () {
      var currentOffer = offer;
      validatePhone(self, currentOffer, questionId, answerId);
    });
  }

  function nextOffer(survey, offer, questionId, answerId) {
    var self = survey;
    var params = {};
    var $offerContainer = $('div#path-survey-offer-container');
    var $coregForm = $offerContainer.find('form');

    $.each($coregForm.find(':input:not([data-ignore])').serializeArray(), function () {
      params[this.name] = this.value;
    });

    saveOfferEvent.call(self, questionId, answerId, offer.id, offer.creative.id, 'conversion', params);
    $offerContainer.slideUp(function () {
      $(this).remove();
      self.next();
    });
  }
  /**
   * Fires when "Enter" is pressed
   * loses focus on TPCA input and hides keyboard on mobile
   */
  function blurTCPA() {
    if ($("#leadid_tcpa_disclosure").val().length === 12) {
      document.activeElement.blur();
    }
  }

  /**
   * Creates an impression.
   * @memberOf PathJS
   *
   * @param questionId
   * @param questionPosition
   */

  function saveQuestionImpression(questionId, questionPosition) {
    if (false === this.options.track) {
      return;
    }

    var self = this;
    path.queue(function () {
      path.jsonp(path.options.api.baseUrl + 'sessions/' + path.session.id + '/surveys/' + self.options.id + '?type=impression&v=2' + '&question_id=' + questionId + '&question_position=' + questionPosition);
    });
  }

  /**
   * Saves a question answer
   * @memberOf PathJS
   *
   * @param questionId
   * @param answerId
   * @param answerPosition
   */
  function saveQuestionAnswer(questionId, answerId, answerPosition) {
    if (false === this.options.track) {
      return;
    }

    var self = this;
    path.queue(function () {
      path.jsonp(path.options.api.baseUrl + 'sessions/' + path.session.id + '/surveys/' + self.options.id + '?type=answer&v=2&question_id=' + questionId + '&answer_id=' + answerId + '&answer_position=' + answerPosition);
    });
  }

  var convertedCoregOffers = {};

  /**
   * Check if an offer has already been presented and converted.
   * @memberOf PathJS
   *
   * @param offerId
   *
   * @returns {boolean}
   */
  function isAlreadyConverted(offerId) {
    return 'undefined' !== typeof convertedCoregOffers[offerId];
  }

  /**
   * Saves a coreg offer impression.
   * @memberOf PathJS
   *
   * @param questionId
   * @param answerId
   * @param offerId
   * @param creativeId
   * @param type
   * @param params
   */
  function saveOfferEvent(questionId, answerId, offerId, creativeId, type, params) {
    if (false === this.options.track) {
      return;
    }

    if ('conversion' === type) {
      if (isAlreadyConverted(offerId)) {
        return;
      }

      convertedCoregOffers[offerId] = true;
    }

    var self = this,
        url = path.options.api.baseUrl + 'sessions/' + path.session.id + '/surveys/' + self.options.id + '/offers/' + offerId;

    if (creativeId) {
      url += '/creatives/' + creativeId;
    }

    url += '/events?type=' + type;

    if (params) {
      url += '&' + $.param({ params: params });
    }

    url += '&question_id=' + questionId;
    url += '&answer_id=' + answerId;
    url += '&v=2';

    path.queue(function () {
      path.jsonp(url);
    });
  }

  /**
   * Returns the question's html.
   * @memberOf PathJS
   *
   * @param question
   *
   * @returns {string}
   */
  function getQuestionHtml(question) {
    var html = '<div class="path-question-container">' + '    <h3 class="path-question">' + question.content + '</h3>' + '    <ul class="path-answer-container">';

    for (var i = 0; i < question.answers.length; i++) {
      html += getAnswerHtml(question.answers[i], question, i + 1);
    }

    html += '    </ul>' + '</div>';

    return html;
  }

  /**
   * Returns the question answer's html.
   * @memberOf PathJS
   *
   * @param answer
   * @param question
   * @param position
   *
   * @returns {string}
   */
  function getAnswerHtml(answer, question, position) {
    return '<li class="path-answer">' + '    <input id="path-answer-' + answer.id + '" name="' + question.id + '" type="radio" value="' + answer.id + '" data-position="' + position + '" />' + '    <label for="path-answer-' + answer.id + '">' + answer.content + '</label>' + '</li>';
  }

  var defaultOptions = {
    id: undefined,
    survey: false,
    test: false,
    track: true,
    optimizedSurvey: false, // optimized survey port
    end: function end() {},
    showQuestion: function showQuestion($el) {
      $el.fadeIn();
    }
  };

  /**
   * Survey constructor.
   * @class Survey
   *
   * @param element
   * @param options
   * @constructor
   */
  function Survey(element, options) {
    this.element = element;
    this.$element = $(element);
    this.$container = this.$element.append('<div id="path-survey-container"></div>');
    this.options = $.extend({}, defaultOptions, options);
    this.$currentQuestion = undefined;
    this.currentQuestionNumber = 0;
    this.questionOffers = {};
    this.shownOffers = {};
    this.shownAnswers = [];
    this.currentOffer = undefined;
    this.survey = undefined;
    this.questions = undefined;
    this.offers = undefined;
    this.loadingNext = true;

    this.nextSurvey = false;

    var preview = path.query('preview');

    if (!preview) {
      init.call(this);
    } else {
      initPreview.call(this, preview);
    }
  }

  /* Rotates to the next question.
   * @memberOf Survey
   *
   */
  Survey.prototype.next = function () {
    var self = this;

    // wait until next question is actually loaded
    if (this.loadingNext) {
      setTimeout(function () {
        self.next();
      }, 100);
    } else {
      if (!self.survey || !self.survey.question) {
        self.options.end();

        return;
      }

      var question = self.questions[self.survey.question];

      self.$currentQuestion = $(getQuestionHtml(question)).hide().appendTo(self.$element);
      self.options.showQuestion(self.$currentQuestion);
      self.$element.trigger('survey.next', [self]);
      saveQuestionImpression.call(self, question.id, self.currentQuestionNumber);
    }
  };

  // Saves an answer.
  Survey.prototype.answer = function (questionId, answerId, position) {
    this.shownAnswers.push({ aid: answerId, t: this.survey.t });
    saveQuestionAnswer.call(this, questionId, answerId, position);
  };

  /**
   * Register Survey as a plugin.
   * @memberOf PathJS
   */
  $.fn.pathSurvey = function (options) {
    if (typeof window.___Z_PATH___ === 'undefined') {
      throw new Error('Path() object must be instantiated.');
    }

    if (!path) {
      path = window.___Z_PATH___;
    }

    return this.each(function () {
      if (!$.data(this, 'pathSurvey')) {
        $.data(this, 'pathSurvey', new Survey(this, options));
      }
    });
  };

  /**
   * Remove a Trusted form script if its been loaded already.
   * @param filename
   */
  var removeTrustedForm = function removeTrustedForm(filename) {
    var tags = document.getElementsByTagName('script');
    for (var i = tags.length; i >= 0; i--) {
      //search backwards within nodelist for matching elements to remove
      if (tags[i] && tags[i].getAttribute('src') != null && tags[i].getAttribute('src').indexOf(filename) != -1) {
        tags[i].parentNode.removeChild(tags[i]); //remove element by calling parentNode.removeChild()
      }
    }
  };

  /**
   * IIFE to call Trusted Form.
   * @memberOf PathJS
   */
  function callTrustedForm() {
    // if trusted form script exists on dom, remove it
    removeTrustedForm('api.trustedform.com');

    // immediately call the function that prints the snippet on the page
    (function () {
      var field = 'xxTrustedFormCertUrl';
      var provideReferrer = false;
      var tf = document.createElement('script');
      tf.type = 'text/javascript';
      tf.async = true;
      tf.src = 'http' + ('https:' == document.location.protocol ? 's' : '') + '://api.trustedform.com/trustedform.js?provide_referrer=' + encodeURI(provideReferrer) + '&field=' + encodeURI(field) + '&l=' + new Date().getTime() + Math.random();
      var s = document.getElementsByTagName('script')[0];
      s.parentNode.insertBefore(tf, s);
    })();
  };
}(jQuery, window, document);