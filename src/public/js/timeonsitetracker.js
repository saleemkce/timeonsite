/**@preserve
 * Commercial License
 *
 * TimeOnSiteTracker.js - Measure your user's Time on site accurately.
 * 
 * Copyright (C) 2016  Saleem Khan
 *
 * License key: {your-license-key-here}
 *
 * This is copyrighted software and requires you buy commericial license
 * before using it. Replace {your-license-key-here} with the licence key 
 * that you buy before starting to use this software. 
 * 
 * visit https://github.com/saleemkce/timeonsite/master/LICENSE.md to learn more about 
 * license terms. 
 */

/**
 * Time on Site Tracker (TOS)
 * This file tracks time spent on page by user session.
 * It exposes getTimeOnPage() API which gives back time spent so far on page. Call any time to get current page's TOS
 * Provides suppport for blacklisting URL from tracking TOS
 * Measure your user's interaction with site directly and accurately.
 */

var TimeOnSiteTracker = function(config) {
    
    this.varyingStartTime = new Date();
    this.pageEntryTime = (new Date()).toISOString();
    this.totalTimeSpent = 0;
    this.returnInSeconds = false;

    this.isTimeOnSiteAllowed = true;
    this.callback = null;
    this.timeSpentArr = [];

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
    this.TOSUserId = 'anonymous';
    this.anonymousTimerId = null;

    /**
     * Anonymous user session:
     * anonymous user session lasts as long as the browser tab is open. Though 
     * it's 15 seconds here. It's continuously renewed for next 15 seconds. If the 
     * user closes the tab and doesn't open it immediately for the next 15 seconds, 
     * then this anonymous user session is ended by TOSTracker.
     *
     * Authenticated user session:
     * authenticated user session will be valid for 1 day unless the user 
     * is logged out explicitly
     */
    this.sessionValidity = {
        anonymous: 15, //15 seconds
        oneDayInSecs: 86400 //86400 seconds = 1 day
    };

    //local storage config
    this.request = {
        url: '',
        headers: []
    };
    this.isRequestHeadersAvailable = false;

    this.developerMode = false;
    
    console.log('Time at page entry: ' + this.varyingStartTime);

    this.initialize(this.config);

};

TimeOnSiteTracker.prototype.initialize = function(config) {
    // bind to window close event
    this.bindWindowUnload();

    // bind to focus/blur window state
    this.bindWindowFocus();

    // // check Storage supported by browser
    // if (typeof(Storage) !== 'undefined') {
    //     this.storageSupported = true;

    //     //process any saved data in local storage
    //     this.processDataInLocalStorage();
    // } else {
    //     console.info('Session/Local storage not supported by this browser.');
    // }

    if(config && config.trackBy && (config.trackBy.toLowerCase() === 'seconds')) {
         this.returnInSeconds = true;
    }

    if(config && config.callback) {
        this.callback = config.callback;
    }

    this.initBlacklistUrlConfig(config);

    if(config && config.trackHistoryChange && (config.trackHistoryChange === true)) {

        // bind to URL change event (without page refresh)
        //this.bindURLChange();
        this.bindWindowHistory();
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
    
    if((config && config.request && config.request.url) && (this.callback === null)) {
        this.storeInLocalStorage = true;
    }

    // check Storage supported by browser
    if (typeof(Storage) !== 'undefined') {
        this.storageSupported = true;

        //process any saved data in local storage
        this.processDataInLocalStorage();
    } else {
        console.info('Session/Local storage not supported by this browser.');
    }

    if((this.storeInLocalStorage === false) && (this.callback === null)) {
        console.warn('TOS data won\'t be available because neither callback nor local stroage option given!');
    }

    if((config && config.request && config.request.url) && this.callback) {
        console.warn('Both callback and local storage options given. Give either one!');
    }

    //Enable "developer mode" to view TOS real-time internal data and logs
    if (config && config.developerMode) {
         this.developerMode = true;
    }

    // create and monitor TOS session
    this.monitorUser();

    this.monitorSession();

    if (this.developerMode) {
        var self = this;
        setInterval(function(){
            self.showProgress();
        }, 1000);
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

TimeOnSiteTracker.prototype.startSession = function(userId) {
    if(userId && (userId.toString()).length) {

        // check storage - user session needs window Storage availability
        if(!this.storageSupported) {
            console.warn('TOS cound not initiate user session due to non-availability of Storage.');
            return;
        }

        //process data accumulated so far before starting new session
        this.monitorSession();
        this.processTOSData();

        // create new authenticated TOS session
        this.TOSUserId = userId;
        this.setCookie('TOSUserId', userId, this.sessionValidity.oneDayInSecs);
        this.createNewSession();
    } else {
        console.warn('Please give proper userId to start TOS session.');
    }

};

TimeOnSiteTracker.prototype.endSession = function() {
    //process data accumulated so far before ending session
    this.monitorSession();
    this.processTOSData();

    // remove session data
    this.removeCookie('TOSUserId');
    this.removeCookie('TOSSessionKey');
    this.removeCookie('TOSSessionDuration');

    //create new TOS session
    this.TOSUserId = 'anonymous';

    this.createNewSession('anonymous');

};

TimeOnSiteTracker.prototype.showProgress = function() {
    var d = this.getTimeOnPage();
    console.log('TimeOnPage(TOP): ' + d.timeOnPage + ' ' + d.timeOnPageTrackedBy);
};

TimeOnSiteTracker.prototype.initBlacklistUrlConfig = function(config) {
    if(config && config.blacklistUrl) {

        if(!((config.blacklistUrl) instanceof Array)) {
            console.warn('blacklistUrl configuration must be of type array');
        }

        if(((config.blacklistUrl) instanceof Array) && (config.blacklistUrl).length) {
            if(!this.checkBlacklistUrl(config.blacklistUrl)) {
                console.info('This page is blacklisted for tracking TOS!');
                this.isTimeOnSiteAllowed = false;
            }
        }
    }
};

TimeOnSiteTracker.prototype.monitorUser = function() {
    var authenticatedUser = this.getCookie('TOSUserId'),
        sessionKey = this.getCookie('TOSSessionKey');

    if(authenticatedUser && authenticatedUser.length) {
        console.info('Authenticated user!!!');
        this.TOSUserId = authenticatedUser;
    } else if(sessionKey && (!authenticatedUser)) {
        console.info('Anonymous user!!!');
        this.renewSession();
    } else {
        this.createNewSession('anonymous');
    }

};

TimeOnSiteTracker.prototype.monitorSession = function() {
    var sessionDuration = this.getCookie('TOSSessionDuration'),
        sessionKey = this.getCookie('TOSSessionKey'),
        pageData,
        count = 0;

    console.log('AT monitorSession, key : '+sessionKey);
    if(!sessionKey) {
        alert('caution, sessionKey empty at : '+new Date());
    }

    pageData = this.getTimeOnPage();
    sessionDuration = parseInt(sessionDuration);
    //console.error('count : ' + ' top : ' + pageData.timeOnPage + 'sessDura: ' + sessionDuration);
    count = pageData.timeOnPage + sessionDuration;
    this.TOSSessionKey = sessionKey;
    this.setCookie('TOSSessionDuration', count, this.sessionValidity.oneDayInSecs);

    this.timeOnSite = count;

};

TimeOnSiteTracker.prototype.createNewSession = function(userType) {
    this.setCookie('TOSSessionDuration', 0, this.sessionValidity.oneDayInSecs);
    this.TOSSessionKey = this.createTOSSessionKey();
    //alert('new cookie created!!!');
    
    if(userType === 'anonymous') {
        //alert('user type is anonymous');
        this.setCookie('TOSSessionKey', this.TOSSessionKey, this.sessionValidity.anonymous);
        this.renewSession();
    } else {//alert('user type is authenticated!');
        if(this.anonymousTimerId) {
            clearInterval(this.anonymousTimerId);
            console.info('Timer cleared '+this.anonymousTimerId);
        } else {alert('Timer not found '+this.anonymousTimerId);}
        //authenticated users session extends till the next day
        this.setCookie('TOSSessionKey', this.TOSSessionKey, this.sessionValidity.oneDayInSecs);
    }

    this.timeOnSite = 0;

};

TimeOnSiteTracker.prototype.renewSession = function() {
    var self = this;
    this.anonymousTimerId = setInterval(function(){
        if (self.developerMode) {
            console.log('Cookie renewed at : '+(new Date()));
        }
        self.setCookie('TOSSessionKey', self.TOSSessionKey, self.sessionValidity.anonymous);
    }, (1 * 1000)); //anonymous user cookie is refresed every second
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
    page.TOSUserId = this.TOSUserId;
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
    if (this.developerMode) {
        console.log('Activity starts at : ' + this.activity.varyingStartTime);
    }
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
        }

        if (this.developerMode) {
            console.log('Total time spent : ' + this.activity.totalTimeSpent + ' in array: '+ ((this.getTimeDiff(this.activity.varyingStartTime, endActivityTime))/1000));
        }
        
        page = this.getPageData();
        page.activityStart = (this.activity.varyingStartTime).toISOString();
        page.activityEnd = (new Date()).toISOString();
        page.timeTaken = Math.round(activityDuration);
        page.timeTakenTrackedBy = ((this.returnInSeconds === true) ? 'second' : 'millisecond');
        page.timeTakenByDuration = ((this.returnInSeconds === true) ? this.secondToDuration(page.timeTaken) : this.secondToDuration(this.millisecondToSecond(page.timeTaken)));

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

        if (this.developerMode) {
            console.log('Activity ends at ' + (new Date()));
        }
        
        if(manualProcess) {
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
            //currentDayKey = this.TOSDayKeyPrefix + (dateObj.getMonth() + 1) + '_' + dateObj.getDate() + '_' + dateObj.getFullYear(),
            dateKey = dateKeys[0];

        //if(currentDayKey != dateKey) {
            console.log('this day key : ' + dateKey)

            var item = localStorage.getItem(dateKey);

            if(item) {
                var itemData = JSON.parse(item);
                
                if((itemData instanceof Array) && itemData.length) {

                    this.sendData(dateKey, itemData);
                }
            }
        // } else {
        //     console.warn('Todays date key found!');
        // }
        
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
 * @param  {[string]} dateKey  [Key that is holding the data for a specific date]
 * @param  {[array]} itemData [The array of TOS data]
 * @return void;
 */
TimeOnSiteTracker.prototype.sendData = function(dateKey, itemData) {
    var url = this.request.url,
        params = JSON.stringify(itemData[0]),
        dateObj = (new Date()),
        currentDayKey = this.TOSDayKeyPrefix + (dateObj.getMonth() + 1) + '_' + dateObj.getDate() + '_' + dateObj.getFullYear(),
        self = this;

    this.xhr = null;
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
        for(var k = 0; k < (this.request.headers).length; k++) {
            var headersObj = (this.request.headers)[k];
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

                    /**
                     * When data is processed from local storage, xhr variable should be 
                     * reset (self.xhr = null) to prevent "cancelXMLHTTPRequest" method call 
                     * that occurs at page close.
                     */
                    self.xhr = null;
                }
            } 
        }
    }
    this.xhr.send(params);
    
};

/**
 * [cancelXMLHTTPRequest This method is called only for data stored in local storage. 
 * When TOSTracker is processing previous page data on new page entry and the current 
 * page is closed, xhr request is cancelled since it's blocking XMLHttpRequest. The 
 * remaining data will be processed in the next page]
 */
TimeOnSiteTracker.prototype.cancelXMLHTTPRequest = function() {

    // check if "abort" exists since earlier version of firefox don't have this method
    if(this.xhr && (typeof this.xhr.abort === 'function')) {
        // console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$');
        // console.log(this.xhr);
        // console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$');
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
        console.log('Page visisbility API not supported in this browser which may result in less accuracy in TOS tracking!');
    } else {
        document.addEventListener(visibilityChange, function() {
            if(document[visibilityState] == 'visible') {
                self.varyingStartTime = new Date();
                self.totalTimeSpent = self.arrayAggregate(self.timeSpentArr);

                if (self.developerMode) {
                    console.log('On visible state');
                    console.log('Time spent on SITE so far : ' + self.totalTimeSpent);
                }

                // compute time duratation for activity if it was started.
                if(self.activity.activityStarted) {
                    self.activity.varyingStartTime = new Date();
                    self.activity.totalTimeSpent = self.arrayAggregate(self.activity.totalTimeSpentArr);
                    if (self.developerMode) {
                        console.log('Time spent on ACTIVITY so far : ' + self.activity.totalTimeSpent);
                    }
                }    
            } else if(document[visibilityState] == 'hidden') {
                if (self.developerMode) {
                    console.log('On invisible state');
                    console.log(self.timeSpentArr);
                }

                var currentTime = new Date();
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
            }

            if (self.developerMode) {
                console.log('Tracked by "SECONDS": ' + self.returnInSeconds);
            }

        }, false);
    }

};

TimeOnSiteTracker.prototype.setCookie = function(cname, cvalue, secs) {
    var d = new Date();
    d.setTime(d.getTime() + (secs * 1000));

    //console.log('cookie expire @ '+new Date(d));

    var expires = 'expires=' + d.toUTCString();
    document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
};

TimeOnSiteTracker.prototype.getCookie = function(cname) {
    var name = cname + '=';
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return '';
};

TimeOnSiteTracker.prototype.removeCookie = function(cname) {
    if(this.getCookie(cname)) {
        document.cookie = cname + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    }
};

// TimeOnSiteTracker.prototype.bindURLChange = function() {
//     var self = this;

//     if ('onhashchange' in window) {
//        window.onhashchange = function() {
//             alert('URL changes  via onhashchange!!!');
//             self.executeURLChangeCustoms();
//         }

//     } else {
//         var hashHandlerOldBrowsers = function() {
//             this.oldHash = window.location.hash;

//             var hashHandler = this;
//             var detectChange = function() {
//                 if(hashHandler.oldHash != window.location.hash){
//                     hashHandler.oldHash = window.location.hash;
//                         alert('URL changes  via HANDLER!!!');
//                         self.executeURLChangeCustoms();
//                     }
//             };

//             setInterval(function() {
//                 detectChange(); 
//             }, 100);
//         }
//         var hashDetection = new hashHandlerOldBrowsers();

//     }
// };

TimeOnSiteTracker.prototype.bindWindowHistory = function() {
    var self = this;
    
    if (window.history && window.history.pushState) {
        (function(history){
            var pushState = history.pushState;
            history.pushState = function(state) {
                if (typeof history.onpushstate === 'function') {
                    history.onpushstate({state: state});
                }
                return pushState.apply(history, arguments);
            }
        })(window.history);


        window.onpopstate = history.onpushstate = function(e) {
            //console.log('now ' + window.location.href);
            setTimeout(function(){
                /**
                 * when URL changes with push/pop states, it captures old title. 
                 * Fix this URL-title mismatch by delaying by 100 milliseconds.
                 */
                if (self.developerMode) {
                    console.info('URL changes via window history object!!!');
                }
                self.executeURLChangeCustoms();
            }, 100);
            
        };
    } else {
        // check if URL change occurs for browsers that don't support window.history
        var hashHandlerOldBrowsers = function() {
            this.oldHash = window.location.hash;

            var hashHandler = this;
            var detectChange = function() {
                if(hashHandler.oldHash != window.location.hash){
                    hashHandler.oldHash = window.location.hash;
                        if (self.developerMode) {
                            console.info('URL changes via location.hash!!!');
                        }
                        self.executeURLChangeCustoms();
                    }
            };

            setInterval(function() {
                detectChange(); 
            }, 100);
        }
        var hashDetection = new hashHandlerOldBrowsers();

    }
};

TimeOnSiteTracker.prototype.executeURLChangeCustoms = function() {
    this.monitorSession();
    this.processTOSData();
    this.initBlacklistUrlConfig(this.config);
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
    if (this.developerMode) {
        console.log('Time at exit: ' + (new Date()));
        console.log('Time so far : ' + this.totalTimeSpent);
    }

    var data = this.getTimeOnPage();
    data.exitTime = (new Date()).toISOString();

    /**
     * execute callback if given in config
     */
    if(this.isTimeOnSiteAllowed) {
        if(typeof this.callback === 'function') {
            data.realTimeTracking = true;
            this.callback(data);
            
        } else if(this.storeInLocalStorage) {
            this.saveToLocalStorage(data);
            
        }
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
