/**
 * TimeOnSiteTracker.js
 *
 * Time on Site Tracker (TOS)
 * This file tracks time spent on page by user session.
 * It exposes getTimeOnPage() API which gives back time spent so far on page. Call any time to get current page's TOS
 * Provides suppport for blacklisting URL from tracking TOS
 * Measure your user's interaction with site directly and accurately.
 * 
 */

var TimeOnSiteTracker = function(config) {
    
    this.varyingStartTime = new Date();
    this.pageEntryTime = (new Date()).toISOString();
    this.totalTimeSpent = 0;
    this.returnInSeconds = false;

    this.isTimeOnSiteAllowed = true;
    this.callback = null;
    this.timeSpentArr = [];
    this.trackHashBasedRouting = false;

    this.storeInLocalStorage = false;
    this.storageSupported = false;
    this.TOSDateKeysHolder = 'TimeOnSiteDateKeys';
    this.TOSDayKeyPrefix = 'TOS_';

    // TOS activity object
    this.activity = {};
    this.activity.activityStarted = false;

    this.config = config;
    this.xhr = null;
    this.timeOnSite = 0;
    this.TOSSessionKey = null;
    this.customData = null;

    //this.request.url = null;
    //this.apiURL = 'http://localhost:4500/data/tos';
    this.request = {
        url: 'http://localhost:4500/data/tos',
        headers: []
    };
    this.isRequestHeadersAvailable = false;
    
    console.log('Time at page entry: ' + this.varyingStartTime);

    this.initialize(this.config); this.processDataInLocalStorage();

};

TimeOnSiteTracker.prototype.initialize = function(config) {

    // bind to window close event
    this.bindWindowUnload();

    // bind to focus/blur window state
    this.bindWindowFocus();

    // check Storage supported by browser
    if (typeof(Storage) !== 'undefined') {
        this.storageSupported = true;
    } else {
        console.info('Session/Local storage not supported by this browser.');
    }

    // create and monitor TOS session
    this.monitorSession();

    if(config && config.trackBy && (config.trackBy.toLowerCase() === 'seconds')) {
         this.returnInSeconds = true;
    }

    if(config && config.callback) {
        this.callback = config.callback;
    }

    this.initBlacklistUrlConfig(config);

    if(config && config.trackHashBasedRouting && (config.trackHashBasedRouting === true)) {
        this.trackHashBasedRouting = true;

        // bind to URL change event (without page refresh)
        this.bindURLChange();
    }

    if(config && config.request && config.request.url) {
        this.request.url = config.request.url;
        this.isURLValid(this.request.url);

        // set if headers given
        if(config.request.headers && ((config.request.headers) instanceof Array)) {
            this.isRequestHeadersAvailable = true;
            this.request.headers = config.request.headers;
        }
    }
    
    if(config && config.storeInLocalStorage && (config.storeInLocalStorage === true) && (this.callback === null)) {
        this.storeInLocalStorage = true;
    }

    if((this.storeInLocalStorage === false) && (this.callback === null)) {
        console.warn('TOS data won\'t be available because neither callback nor local stroage option given!');
    }

    if(config && config.storeInLocalStorage && (config.storeInLocalStorage === true) && this.callback) {
        console.warn('Both callback and local storage options given. Give either one!');
    }
};

TimeOnSiteTracker.prototype.getTimeDiff = function(startTime, endTime) {
    var diff;
    diff = endTime - startTime;
    return diff;
};

// TimeOnSiteTracker.prototype.addTimeSpent = function(a, b) {
//     return a + b;
// };

TimeOnSiteTracker.prototype.arrayAggregate = function(arr) {
    var sum = 0;
    for (var i = 0; i < arr.length; i++) {
        sum = sum +  arr[i];
    }

    return sum;
};

TimeOnSiteTracker.prototype.isURLValid = function(url) {
    var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    if (!regexp.test(url)) {
        console.error('Given URL is not in valid format : "' + url + '"');
    }
};


// TimeOnSiteTracker.prototype.toSerialize = function(obj) {
//     var parts = [];
//     for (var i in obj) {
//         if (obj.hasOwnProperty(i)) {
//             parts.push(encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]));
//         }
//     }
//     return parts.join("&");
// };

/**
 * [createTOSId Creates a new TOSId for each TOS initialziation and Tos.getTimeOnPage() call]
 * @return {[integer]} [It may be of length 12 to 15]
 */
TimeOnSiteTracker.prototype.createTOSId = function() {
    return Math.floor(new Date().valueOf() * Math.random());
};

TimeOnSiteTracker.prototype.millisecondToSecond = function (millsec) {
  return (millsec / 1000);
};

TimeOnSiteTracker.prototype.secondToDuration = function (sec) {
  return (parseInt(sec / 86400) + 'd ' + (new Date(sec%86400*1000)).toUTCString().replace(/.*(\d{2}):(\d{2}):(\d{2}).*/, "$1h $2m $3s"));
};

TimeOnSiteTracker.prototype.getTOSSessionKey = function() {
    return this.TOSSessionKey;
};

TimeOnSiteTracker.prototype.createTOSSessionKey = function() {
    var date = new Date(),
        millisec = date.getMilliseconds() + '',
        uniqId = (++date) + millisec + (Math.floor((Math.random() * 10000) + 1));

    return uniqId;
};

TimeOnSiteTracker.prototype.initBlacklistUrlConfig = function(config) {
    if(config && config.blacklistUrl) {

        if(!((config.blacklistUrl) instanceof Array)) {
            console.warn('blacklistUrl configuration must be of type array');
        }

        if(((config.blacklistUrl) instanceof Array) && (config.blacklistUrl).length) {
            if(!this.checkBlacklistUrl(config.blacklistUrl)) {
               this.isTimeOnSiteAllowed = false;
            }
        }
    }
};

TimeOnSiteTracker.prototype.monitorSession = function() {
    if (this.storageSupported) {

        var sessionDuration = sessionStorage.getItem('TOSsessionDuration'),
            sessionKey = sessionStorage.getItem('TOSsessionKey'),
            pageData,
            count = 0;

        if(sessionDuration && sessionKey) {
            console.log('so far : ' + sessionDuration);
            pageData = this.getTimeOnPage();
            //count = pageData.timeOnPage + Number(sessionDuration);
            sessionDuration = parseInt(sessionDuration);
            count = pageData.timeOnPage + sessionDuration;
            this.TOSSessionKey = sessionKey;
            sessionStorage.setItem('TOSsessionDuration', count);
            this.timeOnSite = count;
        } else {
            //sessionStorage.TOSsessionDuration = 0;
            sessionStorage.setItem('TOSsessionDuration', 0);
            this.TOSSessionKey = this.createTOSSessionKey();
            sessionStorage.setItem('TOSsessionKey', this.TOSSessionKey);
            this.timeOnSite = 0;
        }
        
    }
};

// URL blacklisting from tracking in "Time on site"
TimeOnSiteTracker.prototype.checkBlacklistUrl = function(blacklistUrl) {
    var currentPage = document.URL;
    for(var i = 0; i < blacklistUrl.length; i++) {
        if(blacklistUrl[i] === currentPage) {
            return false;
        }
    }

    return true;
};

TimeOnSiteTracker.prototype.getPageData = function() {
    var page = {};
    page.TOSId = this.createTOSId();
    page.TOSSessionKey = this.TOSSessionKey;
    page.URL = document.URL;
    page.title = document.title;
    return page;
}

TimeOnSiteTracker.prototype.getTimeOnPage = function() {
    var currentTime = new Date(),
        newTimeSpent = 0,
        page;

    if(this.timeSpentArr.length) {
        this.totalTimeSpent =  this.arrayAggregate(this.timeSpentArr);
    }

    if(this.returnInSeconds) {
        newTimeSpent = this.totalTimeSpent + ((this.getTimeDiff(this.varyingStartTime, currentTime))/1000);
    } else {
        newTimeSpent = this.totalTimeSpent + (this.getTimeDiff(this.varyingStartTime, currentTime));
    }

    page = this.getPageData();

    // get custom data
    page = this.mergeCustomData(page);
    // page.TOSId = this.createTOSId();
    // page.TOSSessionKey = this.TOSSessionKey;
    // page.URL = document.URL;
    // page.title = document.title;
    page.entryTime = this.pageEntryTime;
    page.currentTime = (new Date()).toISOString();
    page.timeOnPage = Math.round(newTimeSpent);
    page.timeOnPageTrackedBy = ((this.returnInSeconds === true) ? 'second' : 'millisecond');
    page.timeOnSite = this.timeOnSite;
    page.timeOnPageByDuration = ((this.returnInSeconds === true) ? this.secondToDuration(page.timeOnPage) : this.secondToDuration(this.millisecondToSecond(page.timeOnPage)));
    page.timeOnSiteByDuration = ((this.returnInSeconds === true) ? this.secondToDuration(page.timeOnSite) : this.secondToDuration(this.millisecondToSecond(page.timeOnSite)));
    page.trackingType = 'tos';

    return page;
    
};

TimeOnSiteTracker.prototype.mergeCustomData = function(data) {
    if(this.customData) {
        for(var key in this.customData) {
            data[key] = this.customData[key];
        }
    }
    return data;
};

TimeOnSiteTracker.prototype.setCustomData = function(data) {
    if(data && Object.keys(data).length) {
        this.customData = data;
    } else {
        console.warn('custom data should be of type object!');
    }
};

TimeOnSiteTracker.prototype.unsetCustomData = function() {
    this.customData = null;
};

/**
 * [resetActivity It is used for both initializing and resetting activity varibales]
 */
TimeOnSiteTracker.prototype.resetActivity = function() {
    this.activity.varyingStartTime = new Date();
    this.activity.totalTimeSpent = 0;
    this.activity.totalTimeSpentArr = [];
};

TimeOnSiteTracker.prototype.startActivity = function(activityDetails) {
    if(activityDetails && Object.keys(activityDetails).length) {
        this.startActivityDetails = activityDetails;
    }

    this.resetActivity();
    this.activity.activityStarted = true;
    console.log('activity started at : ' + this.activity.varyingStartTime)
};

//manualProcess = true setting prevents data from being sent immediately to server on ending activity
TimeOnSiteTracker.prototype.endActivity = function(activityDetails, manualProcess) {
    var page = {};

    if(this.activity.activityStarted) {console.log(this.activity.varyingStartTime);
        var endActivityTime = new Date(),
            activityDuration = 0;

        if((this.activity.totalTimeSpentArr).length) {
            this.activity.totalTimeSpent =  this.arrayAggregate(this.activity.totalTimeSpentArr);
        }

        if(this.returnInSeconds) {
            activityDuration = this.activity.totalTimeSpent + ((this.getTimeDiff(this.activity.varyingStartTime, endActivityTime))/1000);
        } else {
            activityDuration = this.activity.totalTimeSpent + this.getTimeDiff(this.activity.varyingStartTime, endActivityTime);
        }console.log('totalSpent : ' + this.activity.totalTimeSpent + ' in array: '+ ((this.getTimeDiff(this.activity.varyingStartTime, endActivityTime))/1000));
        
        page = this.getPageData();
        page.activityStart = (this.activity.varyingStartTime).toISOString();
        page.activityEnd = (new Date()).toISOString();
        page.activityDuration = Math.round(activityDuration);
        page.activityDurationTrackedBy = ((this.returnInSeconds === true) ? 'second' : 'millisecond');

        // set (start) activity details in response if given during activity initialization
        for(var key in this.startActivityDetails) {
            page[key] = this.startActivityDetails[key];
        }

        if(activityDetails && Object.keys(activityDetails).length) {
            for(var key in activityDetails) {
                page[key] = activityDetails[key];
            }
        }
        page.trackingType = 'activity';  

        this.activity.activityStarted = false;
        this.resetActivity();
        console.log('activity ends at ' + new Date());
        
        if(manualProcess && manualProcess === true) {
            // do nothing
        } else {
            this.processActivityData(page);
        }
        

    } else {
        console.warn('Please start activity before finishing it!');
    }

    return page;
};

TimeOnSiteTracker.prototype.processActivityData = function(data) {
    if(typeof this.callback === 'function') {
        data.realTimeTracking = true;
        this.callback(data);
    } else if(this.storeInLocalStorage) {
        this.saveToLocalStorage(data);
    }
};

// save time on site data to Local storage.
TimeOnSiteTracker.prototype.saveToLocalStorage = function(data) {

    if (this.storageSupported) {

        var dateObj = (new Date()),
            currentDayKey = this.TOSDayKeyPrefix + (dateObj.getMonth() + 1) + '_' + dateObj.getDate() + '_' + dateObj.getFullYear(),
            keyFound = false,
            keyName = this.TOSDateKeysHolder,
            keyArr;

        keyArr = localStorage.getItem(keyName);
        if(keyArr) {
            var dateKeys = JSON.parse(keyArr);
            
            for(var j = 0; j < dateKeys.length; j++) {
                if(dateKeys[j] == currentDayKey) {
                    keyFound = true;
                    break; 
                }
            }

            if(!keyFound) {
                dateKeys.push(currentDayKey);
                localStorage.setItem(keyName, JSON.stringify(dateKeys));
            }
        } else {
            keyArr = [];
            keyArr.push(currentDayKey); 
            localStorage.setItem(keyName, JSON.stringify(keyArr));
        }


        var item = localStorage.getItem(currentDayKey);
        if(item) {
            //console.log('TOS available!');
            var oldItem = JSON.parse(item);
            oldItem.push(data)
            //console.log(oldItem);
            localStorage.setItem(currentDayKey, JSON.stringify(oldItem));
        } else {
            //console.log('new TOS added!');
            var newItem = [];
            newItem.push(data);
            localStorage.setItem(currentDayKey, JSON.stringify(newItem));
        }
    } else {
        console.warn('Local storage not supported for TOS tracking!');
    }
};

TimeOnSiteTracker.prototype.processDataInLocalStorage = function() {

    var dateKeys = this.getDateKeys();

    if((dateKeys instanceof Array) && dateKeys.length) {
        var dateObj = (new Date()),
            currentDayKey = this.TOSDayKeyPrefix + (dateObj.getMonth() + 1) + '_' + dateObj.getDate() + '_' + dateObj.getFullYear(),
            dateKey = dateKeys[0];

        if(currentDayKey != dateKey) {
            console.log('this day key : ' + dateKey)

            var item = localStorage.getItem(dateKey);

            if(item) {
                var itemData = JSON.parse(item);
                
                if((itemData instanceof Array) && itemData.length) {

                    this.sendData(dateKey, itemData);
                }   
            }
        } else {
            console.warn('Todays date key found!');
        }
        
    }
};

TimeOnSiteTracker.prototype.getDateKeys = function() {
    var dateKeys = [];
    if (this.storageSupported) {
        var keyName = this.TOSDateKeysHolder,
            keyArr = localStorage.getItem(keyName);

        if(keyArr) {
            dateKeys = JSON.parse(keyArr);
        }
    }
    return dateKeys;
};

TimeOnSiteTracker.prototype.removeDateKey = function(dateKey) {
    var keyName = this.TOSDateKeysHolder,
        dateKeys = this.getDateKeys();
    
    if(this.storageSupported) {
        if((dateKeys instanceof Array) && dateKeys.length) {
            for(var i = 0; i < dateKeys.length; i++) {
                if(dateKeys[i] == dateKey) {
                    //console.log('before')
                    //console.log(dateKeys)
                    dateKeys.splice(i, 1);
                    //console.log('after')
                    console.log(dateKeys);

                    //console.info('key removed : ' + dateKey);

                    localStorage.removeItem(dateKey);

                    localStorage.setItem(keyName, JSON.stringify(dateKeys));

                    if(dateKeys.length) {
                        //console.info('calling new key : ' + dateKeys[0]);
                        this.processDataInLocalStorage();
                    }
                    //console.log(dateKeys);

                }
            }
        }
    }
    
};

/**
 * [sendData This method reads data from local storage and make API calls with POST 
 * method synchronously for posting data to server one at a time. When page close event 
 * occurs, the API call is cancelled.]
 * @param  {[string]} dateKey  [description]
 * @param  {[array]} itemData [description]
 * @return void;
 */
TimeOnSiteTracker.prototype.sendData = function(dateKey, itemData) {//console.log('PP');console.log(thisItem);
    
    var url = this.request.url,
        params = JSON.stringify(itemData[0]),
        dateObj = (new Date()),
        currentDayKey = this.TOSDayKeyPrefix + (dateObj.getMonth() + 1) + '_' + dateObj.getDate() + '_' + dateObj.getFullYear(),
        self = this;

    this.xhr = false;
    if (window.XMLHttpRequest) {
        this.xhr = new XMLHttpRequest();
    } else { // code for IE6, IE5
        this.xhr = new ActiveXObject('Microsoft.XMLHTTP');
    }

    this.xhr.open('POST', url, false); //synchronous call

    //Send the proper header information along with the request
    this.xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

    // check and set request headers if given
    if(this.isRequestHeadersAvailable && (this.request.headers).length) {
        for(var k = 0; k < (config.request.headers).length; k++) {
            var headersObj = (config.request.headers)[k];
            for(var key in headersObj) {
                this.xhr.setRequestHeader(key, headersObj[key]);
            }
        }
    }

    this.xhr.onreadystatechange = function() {//Call a function when the state changes.
        if(self.xhr.readyState == 4 && self.xhr.status == 200) {
            if(self.xhr.responseText == 'success') {
                itemData.shift();
                console.log('itemData.length is : '+ itemData.length);
                if(itemData.length) {
                    console.log('calling next item to process');
                    setTimeout(function(){
                        self.sendData(dateKey, itemData);
                    }, 500);
                } else {
                    self.removeDateKey(dateKey);
                }
            } 
        }
    }
    this.xhr.send(params);
    
};

TimeOnSiteTracker.prototype.cancelXMLHTTPRequest = function() {

    // check if "abort" exists since earlier version of firefox don't have this method
    if(this.xhr && (typeof this.xhr.abort === 'function')) {
        console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$');
        console.log(this.xhr);
        console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$');
        this.xhr.abort();
    }
};


TimeOnSiteTracker.prototype.bindWindowFocus = function() {

    // check the visiblility of the page
    var self = this,
        hidden, visibilityState, visibilityChange; // check the visiblility of the page

    if (typeof document.hidden !== 'undefined') {
        hidden = 'hidden', visibilityChange = 'visibilitychange',
        visibilityState = 'visibilityState';
    }
    else if (typeof document.mozHidden !== 'undefined') {
        hidden = 'mozHidden', visibilityChange = 'mozvisibilitychange',
        visibilityState = 'mozVisibilityState';
    }
    else if (typeof document.msHidden !== 'undefined') {
        hidden = 'msHidden', visibilityChange = 'msvisibilitychange',
        visibilityState = 'msVisibilityState';
    }
    else if (typeof document.webkitHidden !== 'undefined') {
        hidden = 'webkitHidden', visibilityChange = 'webkitvisibilitychange',
        visibilityState = 'webkitVisibilityState';
    }

    if (typeof document.addEventListener === 'undefined' || typeof hidden === 'undefined') {
        console.log('Page visisbility API not supported which may result in less accuracy in TOS!');
    } else {
        document.addEventListener(visibilityChange, function() {
            if(document[visibilityState] == 'visible') {
                console.log('on visible');
                self.varyingStartTime = new Date();
                self.totalTimeSpent = self.arrayAggregate(self.timeSpentArr);
                console.log('Time spent on site so far : ' + self.totalTimeSpent);

                // compute time duratation for activity if it was started.
                if(self.activity.activityStarted) {
                    self.activity.varyingStartTime = new Date();
                    self.activity.totalTimeSpent = self.arrayAggregate(self.activity.totalTimeSpentArr);
                    console.log('Time spent on ACTIVITY so far : ' + self.activity.totalTimeSpent);
                }
            console.log('SECONDS ' + self.returnInSeconds)    
            } else if(document[visibilityState] == 'hidden') {
                console.log('on Invisible');
                var currentTime = new Date();
                console.log(self.timeSpentArr);
                if(self.returnInSeconds) {
                    (self.timeSpentArr).push(((self.getTimeDiff(self.varyingStartTime, currentTime))/1000));
                } else {
                    (self.timeSpentArr).push(self.getTimeDiff(self.varyingStartTime, currentTime));
                }

                // compute time duratation for activity if it was started.
                if(self.activity.activityStarted) {
                    console.log(self.activity.totalTimeSpentArr);
                    if(self.returnInSeconds) {
                        (self.activity.totalTimeSpentArr).push(((self.getTimeDiff(self.activity.varyingStartTime, currentTime))/1000));
                    } else {
                        (self.activity.totalTimeSpentArr).push(self.getTimeDiff(self.activity.varyingStartTime, currentTime));
                    }
                }
            console.log('SECONDS ' + self.returnInSeconds)    
            }

        }, false);
    }

};

// TimeOnSiteTracker.prototype.setCookie = function(cname, cvalue, exdays) {console.log('inside cookie');
//     var d = new Date();
//     d.setTime(d.getTime() + (exdays*24*60*60*1000));
//     var expires = "expires="+d.toUTCString();
//     document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
// };

// TimeOnSiteTracker.prototype.getCookie = function(cname) {
//     var name = cname + "=";
//     var ca = document.cookie.split(';');
//     for(var i = 0; i < ca.length; i++) {
//         var c = ca[i];
//         while (c.charAt(0) == ' ') {
//             c = c.substring(1);
//         }
//         if (c.indexOf(name) == 0) {
//             return c.substring(name.length, c.length);
//         }
//     }
//     return "";
// };

// TimeOnSiteTracker.prototype.checkCookie = function() {
//     var user = getCookie("username");
//     if (user != "") {
//         alert("Welcome again " + user);
//     } else {
//         user = prompt("Please enter your name:", "");
//         if (user != "" && user != null) {
//             setCookie("username", user, 365);
//         }
//     }
// };





TimeOnSiteTracker.prototype.bindURLChange = function() {
    var self = this;
    window.onhashchange = function() {
        alert('URL changes!!!');
        self.monitorSession();
        self.processTOSData();
        self.initBlacklistUrlConfig(self.config);
    }
};

/**
 * [bindWindowUnload]
 *
 * A cross browser solution for window unload event.
 * 
 */
TimeOnSiteTracker.prototype.bindWindowUnload = function() {
    var self = this,
        windowAttachEventListener = window.attachEvent || window.addEventListener,
        unloadEvent = window.attachEvent ? 'onbeforeunload' : 'beforeunload'; // make IE7, IE8 compitable

    windowAttachEventListener(unloadEvent, function(event) { // For >=IE7, Chrome, Firefox
        //var message = 'Important: Please click on \'Save\' button to leave this page.';
        if (typeof event == 'undefied') {
            event = window.event;
        }
        if (event) {//event.returnValue = message;

            self.monitorSession();

            self.processTOSData();

            // cancelling running XHR requests...
            self.cancelXMLHTTPRequest();

        }
        //return message;
    });

};

TimeOnSiteTracker.prototype.processTOSData = function() {

    console.log('Time at page exit: ' + new Date());

    var data = this.getTimeOnPage();
    data.exitTime = (new Date()).toISOString();

    console.log('time so far : ' + this.totalTimeSpent);

    /**
     * execute callback if given in config
     */
    if(typeof this.callback === 'function') {
        if(this.isTimeOnSiteAllowed) {
            data.realTimeTracking = true;
            this.callback(data);
        } else {
            data = {};
            this.callback(data);
        }
        
    } else if(this.isTimeOnSiteAllowed && this.storeInLocalStorage) {
        this.saveToLocalStorage(data);
    }

    // Initialize variables on URL change.
    this.varyingStartTime = new Date(),
    this.pageEntryTime = (new Date()).toISOString(),
    this.totalTimeSpent = 0,
    this.timeSpentArr = [];

    //Reset activity variables
    if(this.activity.activityStarted) {
        this.activity.activityStarted = false;
        this.resetActivity();
    }
};

// transfers sessionStorage from one tab to another
var preserveNewTabSessionStorage = function() {
    console.log('New tab session monitoring: on');
    var sessionStorage_transfer = function(event) {
        if(!event) { event = window.event; } // ie suq
        if(!event.newValue) return;          // do nothing if no value to work with
        if (event.key == 'getSessionStorage') {
            // another tab asked for the sessionStorage -> send it
            localStorage.setItem('sessionStorage', JSON.stringify(sessionStorage));
            // the other tab should now have it, so we're done with it.
            localStorage.removeItem('sessionStorage'); // <- could do short timeout as well.
        } else if (event.key == 'sessionStorage' && !sessionStorage.length) {
            // another tab sent data <- get it
            var data = JSON.parse(event.newValue);
            var wantedSessionKeys = ['TOSsessionDuration', 'TOSsessionKey'];
            for (var key in data) {
                for(var j =0; j < wantedSessionKeys.length; j++) {
                    if(wantedSessionKeys[j] == key) {
                        sessionStorage.setItem(key, data[key]);
                        continue;
                    }
                }
            }
        }
    };

    // listen for changes to localStorage
    if(window.addEventListener) {
        window.addEventListener("storage", sessionStorage_transfer, false);
    } else {
        window.attachEvent("onstorage", sessionStorage_transfer);
    };


    // Ask other tabs for session storage (this is ONLY to trigger event)
    if (!sessionStorage.length) {
        localStorage.setItem('getSessionStorage', 'testData');
        localStorage.removeItem('getSessionStorage', 'testData');
    };
}();