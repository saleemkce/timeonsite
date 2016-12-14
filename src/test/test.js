
// Run with mocha-phantomjs test.html
var Tos = new TimeOnSiteTracker();

describe('TimeOnSiteTracker Tests', function () {
    
    it('Check if TOS is loaded', function () {
        //console.log('Location: ' + window.location);
        expect(Tos).to.be.an.instanceof(TimeOnSiteTracker);
        
    });
 
    it('Check if TOS methods are present', function () {
        
        // Add all new methods added to TOS construtor
        var methodsArr = [
            'varyingStartTime','pageEntryTime','totalTimeSpent','returnInSeconds',
            'isTimeOnSiteAllowed','callback','timeSpentArr',
            'storeInLocalStorage','storageSupported','TOSDateKeysHolder','TOSDayKeyPrefix',
            'activity','config','xhr','timeOnSite','TOSSessionKey','customData','request',
            'isRequestHeadersAvailable','initialize','getTimeDiff','arrayAggregate',
            'isURLValid','createTOSId','getTOSSessionKey','createTOSSessionKey',
            'initBlacklistUrlConfig','monitorSession','checkBlacklistUrl','getPageData',
            'getTimeOnPage','mergeCustomData','setCustomData','unsetCustomData','resetActivity',
            'startActivity','endActivity','processActivityData','saveToLocalStorage',
            'processDataInLocalStorage','getDateKeys','removeDateKey','sendData',
            'cancelXMLHTTPRequest','bindWindowFocus','bindWindowUnload',
            'processTOSData', 'millisecondToSecond', 'secondToDuration', 
            'executeURLChangeCustoms', 'bindWindowHistory', 'regenerateTOSSession'
            // 'trackHashBasedRouting', 'bindURLChange',
        ];

        var TOSMethodsArr = [];
        for(var k in Tos){
            TOSMethodsArr.push(k);
        };

        expect((methodsArr.length)).to.equal((TOSMethodsArr.length));
        
    });

    it('Check if getTimeOnPage function has all required params', function () {
        
        var data = Tos.getTimeOnPage(),
            minimalDataLength = 10; // number of keys in getTimeOnPage()
        // console.log(data);
        // 'TOSId':1030053680354,'TOSSessionKey':'14800896718818801260',
        // 'URL':'file:///C:/tests/test.html',
        // 'title':'TimeOnSiteTracker Tests','entryTime':'2016-11-25T16:01:11.879Z',
        // 'currentTime':'2016-11-25T16:01:11.891Z','timeOnPage':12,
        // 'timeOnPageTrackedBy':'millisecond','timeOnSite':0,'trackingType':'tos'
        
        expect(data).to.have.property('TOSId');

        expect(data.TOSId).to.not.be.null;

        expect(data).to.have.property('TOSSessionKey');
        expect(data.TOSSessionKey).to.not.be.null;
        expect(data.TOSSessionKey).to.be.a('string');

        expect(data).to.have.property('URL');
        expect(data.URL).to.not.be.null;
        expect(data.URL).to.be.a('string');

        expect(data).to.have.property('title');
        expect(data.title).to.not.be.null;
        expect(data.title).to.be.a('string');

        expect(data).to.have.property('entryTime');
        expect(data.entryTime).to.not.be.null;
        expect(data.entryTime).to.be.a('string');

        expect(data).to.have.property('currentTime');
        expect(data.currentTime).to.not.be.null;
        expect(data.currentTime).to.be.a('string');

        expect(data).to.have.property('timeOnPage');
        expect(data.timeOnPage).to.not.be.null;
        //expect(data.timeOnPage).to.be.a('string');

        expect(data).to.have.property('timeOnPageTrackedBy');
        expect(data.timeOnPageTrackedBy).to.not.be.null;
        expect(data.timeOnPageTrackedBy).to.be.a('string');

        expect(data).to.have.property('timeOnSite');
        expect(data.timeOnSite).to.not.be.null;
        //expect(data.timeOnSite).to.be.a('date');
        
        expect(data).to.have.property('timeOnPageByDuration');
        expect(data.timeOnPageByDuration).to.not.be.null;

        expect(data).to.have.property('timeOnSiteByDuration');
        expect(data.timeOnSiteByDuration).to.not.be.null;



        expect(data).to.have.property('trackingType');
        expect(data.trackingType).to.not.be.null;
        expect(data.trackingType).to.be.a('string');

        expect(Object.keys(data).length).to.be.at.least(minimalDataLength);
        
    });
    
    it('check if arrayAggregate method works', function () {
        var testArr = [5, 10, 15],
            count = 30;
        expect(Tos.arrayAggregate(testArr)).to.equal(count);
    });

    it('check if getTimeDiff method works', function () {
        var date1 = new Date(),
            date2 = new Date(),
            appropriateDiff = 1800000;

            date2.setMinutes(date1.getMinutes() + 30);
            
        expect(Tos.getTimeDiff(date1, date2)).to.equal(appropriateDiff);
    });

    
    it('check if createTOSId method works', function () {
        var TosId = Tos.createTOSId();
        
        expect(TosId).to.not.be.null;
        expect(TosId).to.not.be.a('string');
    });

    it('check if getTOSSessionKey method works and session key be of type string', function () {
        var TossessionKey = Tos.getTOSSessionKey();
        
        expect(TossessionKey).to.not.be.null;
        expect(TossessionKey).to.be.a('string');
        expect(Tos.TOSSessionKey).to.equal(TossessionKey);
    });
    
    
    it('check if createTOSSessionKey method works and session key is new', function () {
        var TossessionKey = Tos.createTOSSessionKey();
        
        expect(TossessionKey).to.not.be.null;
        expect(TossessionKey).to.be.a('string');

        // new key should be different than one created during initialization
        expect(TossessionKey).to.not.equal(Tos.TOSSessionKey);
    });
    
    it('check if checkBlacklistUrl method works: URL blacklisted', function () {
        var thisPageUrl = window.location, 
            url = [thisPageUrl],
            result = Tos.checkBlacklistUrl(url);
        
        //expect(result).to.equal(false);
    });

    it('check if checkBlacklistUrl method works: URL not blacklisted', function () {
        var url = ['file:///C:/tests/bbc.html'],
            result = Tos.checkBlacklistUrl(url);
        
        expect(result).to.equal(true);
    });

    
    it('check if getPageData method works', function () {
        var data = Tos.getPageData(),
            minimalLength = 4;
        
        expect(data).to.not.be.empty;
        expect(data).to.be.an('object');
        expect(Object.keys(data).length).to.be.at.least(minimalLength);
    });

    it('check if mergeCustomData method works', function () {
        var dataObject = {a:234287, b:'test', c:[1,2]},
            page = Tos.getPageData(),
            originalMergedData,
            originalSize = 7; // 4 from getPageData + 3 from dataObject

            for(var k in dataObject) {
                page[k] = dataObject[k];
            }
            
            // check with custom data object having length > 0
            var newData = Tos.mergeCustomData(page);
            expect(Object.keys(newData).length).to.equal(originalSize);

            page = Tos.getPageData();
            emptyObject = {};
            for(var k in emptyObject) {
                page[k] = emptyObject[k];
            }
            originalSize = 4; // 4 from getPageData + 0 from emptyObject

            // check with empty custom object
            newData = Tos.mergeCustomData(page);
            expect(Object.keys(newData).length).to.equal(originalSize);

    });


    it('check if setCustomData method works', function () {
        var dataObject = {a:234287, b:'test', c:[1,2]};

        Tos.setCustomData(dataObject);

        expect(Tos.customData).to.not.be.null;
        expect(Tos.customData).to.have.property('a');
        expect(Tos.customData).to.have.property('b');
        expect(Tos.customData.b).to.be.a('string');
        expect(Tos.customData).to.have.property('c');
        expect(Tos.customData.c).to.be.instanceof(Array);
    });

    it('check if unsetCustomData method works', function () {
        Tos.unsetCustomData();

        expect(Tos.customData).to.be.null;
    });

});

describe('Activity tracking Tests', function () {

    it('check if resetActivity method works', function () {
        Tos.resetActivity();

        expect(Tos.activity.varyingStartTime).to.not.be.null;
        expect(Tos.activity.totalTimeSpent).to.equal(0)
        expect(Tos.activity.totalTimeSpentArr).to.be.instanceof(Array);
        expect(Tos.activity.totalTimeSpentArr).to.have.lengthOf(0);
    });

    it('check if startActivity method works', function () {
        Tos.startActivity();

        expect(Tos.activity.activityStarted).to.equal(true);
        expect(Tos.activity.varyingStartTime).to.be.a('date');
    });

    it('check if startActivity works with data', function () {
        var activity = {a:234287, b:'test', c:[1,2]};
        Tos.startActivity(activity);

        expect(Tos.startActivityDetails).to.be.an('object');
        expect(Tos.startActivityDetails).to.have.property('a');
        expect(Tos.startActivityDetails.a).to.equal(activity.a);
        expect(Tos.startActivityDetails).to.have.property('b');
        expect(Tos.startActivityDetails.b).to.equal(activity.b);
        expect(Tos.startActivityDetails).to.have.property('c');
        expect(Tos.startActivityDetails.c).to.equal(activity.c);
    });

    it('check if endActivity method works', function () {
        var activity = Tos.endActivity(),
            activityData = {a:234287, b:'test', c:[1,2]};

        expect(Tos.activity.totalTimeSpent).to.not.be.null;
        expect(Tos.activity.activityStarted).to.equal(false);
        expect(activity).to.be.an('object');
        expect(activity).to.have.property('TOSId');
        expect(activity).to.have.property('TOSSessionKey');
        expect(activity).to.have.property('URL');
        expect(activity).to.have.property('title');
        expect(activity).to.have.property('activityStart');
        expect(activity).to.have.property('activityEnd');
        expect(activity).to.have.property('timeTaken');
        expect(activity).to.have.property('timeTakenTrackedBy');
        expect(activity).to.have.property('timeTakenByDuration');
        expect(activity).to.have.property('trackingType');

        // custom start activity details
        expect(activity).to.have.property('a');
        expect(activity).to.have.property('b');
        expect(activity).to.have.property('c');

        expect(activity.a).to.equal(activityData.a);
        expect(activity.b).to.equal(activityData.b);
        expect(activity.c).to.have.lengthOf(2);
    });

    it('check if endActivity method works with data', function () {
        var activity = Tos.endActivity(),
             activityData = {d: 234287, e: 'test', f: [1,2]};
        // activity is empty object becasue there is no startActivity() call yet
        expect(activity).to.be.an('object');

        Tos.startActivity();
        activity = Tos.endActivity(activityData);
        expect(Tos.activity.totalTimeSpent).to.not.be.null;
        expect(Tos.activity.activityStarted).to.equal(false);
        expect(activity).to.be.an('object');
        expect(activity).to.have.property('TOSId');
        expect(activity).to.have.property('TOSSessionKey');
        expect(activity).to.have.property('URL');
        expect(activity).to.have.property('title');
        expect(activity).to.have.property('activityStart');
        expect(activity).to.have.property('activityEnd');
        expect(activity).to.have.property('timeTaken');
        expect(activity).to.have.property('timeTakenByDuration');
        expect(activity).to.have.property('timeTakenTrackedBy');
        expect(activity).to.have.property('trackingType');

        // custom end activity details
        expect(activity).to.have.property('d');
        expect(activity).to.have.property('e');
        expect(activity).to.have.property('f');

        expect(activity.d).to.equal(activityData.d);
        expect(activity.e).to.equal(activityData.e);
        expect(activity.f).to.have.lengthOf(2);
    });
    
    it('check if endActivity method works with data with callback', function (done) {
        var config = {
            trackBy: 'seconds',
            callback: function(data) {
                console.log(data);

                // give your endpoint URL/ server-side URL that is going to handle your TOS data
                // which is of POST method. Eg. PHP, nodejs or python URL which saves this data to your DB
                var endPointUrl = 'http://localhost:4500/data/tos';

                if(data && data.trackingType) {
                    
                    // make use of sendBeacon if this API is supported by your browser
                    if(navigator && typeof navigator.sendBeacon === 'function'){
                        //var debug = data;
                        data.trasferredWith = 'sendBeacon';
                        var blob = new Blob([JSON.stringify(data)], {type : 'application/json'});
                        navigator.sendBeacon(endPointUrl, blob);
                        done();
                    } else {

                        // XMLHttpRequest begins..
                        var url = endPointUrl,
                            params = JSON.stringify(data),
                            xhr;

                        if (window.XMLHttpRequest) {
                            xhr = new XMLHttpRequest();
                        } else { // code for IE6, IE5
                            xhr = new ActiveXObject('Microsoft.XMLHTTP');
                        }

                        xhr.open('POST', url, false); //synchronous call; changing this to true will make it
                        //asynchronous request and data won't be saved in your DB.

                        //Send the proper header information along with the request
                        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

                        xhr.onreadystatechange = function() {//Call a function when the state changes.
                            if(xhr.readyState == 4 && xhr.status == 200) {
                                if(xhr.responseText == 'success') {
                                    console.log('Data saved successfully!');
                                    done();
                                    //Warning: But you should not do more operations here since it will block
                                    //user from closing the application or slow down site navigation
                                } 
                            }
                        }
                        xhr.send(params);
                        // XMLHttpRequest ends..
                        
                    }
                    
                }
                
            }
        };
        var Tos = new TimeOnSiteTracker(config);

        Tos.startActivity();
        //processActivityData method is called automatically when called endActivity method
        Tos.endActivity();

        expect(Tos.callback).to.equal(config.callback);
    });
    

});


describe('TimeOnSiteTracker with configuration Tests', function () {

    it('Initialize TimeOnSiteTracker without configuration', function () {
        var Tos = new TimeOnSiteTracker(),
            dateKeysHolder = 'TimeOnSiteDateKeys',
            dayKeyPrefix = 'TOS_';

        expect(Tos.returnInSeconds).to.equal(false);
        expect(Tos.callback).to.equal(null);
        expect(Tos.storeInLocalStorage).to.equal(false);

        expect(Tos.isTimeOnSiteAllowed).to.equal(true);
        expect(Tos.TOSDateKeysHolder).to.equal(dateKeysHolder);
        expect(Tos.TOSDayKeyPrefix).to.equal(dayKeyPrefix);
        expect(Tos.config).to.be.empty;

        expect(Tos.activity).to.be.an('object');
        expect(Tos.activity.activityStarted).to.equal(false);

        expect(Tos.xhr).to.equal(null);
        expect(Tos.timeOnSite).to.not.equal(null);
        expect(Tos.TOSSessionKey).not.equal(null);
        expect(Tos.customData).to.equal(null);

        expect(Tos.isRequestHeadersAvailable).to.equal(false);
        expect(Tos.request).to.be.an('object');
        expect(Tos.request).to.have.property('url');
        expect(Tos.request).to.have.property('headers');
        expect(Tos.request.headers).to.be.instanceof(Array);
        expect(Tos.request.headers).to.have.lengthOf(0);

    });

    it('Initialize TimeOnSiteTracker with callback param', function () {
        var config = {
            callback: function(data) {  // if you give callback, it becomes real-time tracking
                window.open('http://www.example.com?'+JSON.stringify(data), 'hi', 'height=200,width=200');
        }};
        var Tos = new TimeOnSiteTracker(config);

        expect(Tos.callback).to.not.be.null;
        expect(Tos.callback).to.be.a('Function');
    });

    it('Initialize TimeOnSiteTracker with trackBy param', function () {
        var config = {
            trackBy: 'seconds'
        };
        var Tos = new TimeOnSiteTracker(config);

        //this pre-condition for checking returnInSeconds
        expect(config.trackBy).to.equal('seconds');

        expect(Tos.returnInSeconds).to.equal(true);
    });

    it('Initialize TimeOnSiteTracker with blacklistUrl param with current URL', function () {
        var config = {
            blacklistUrl: [window.location]
        };

        // siteAllowed by default
        var Tos = new TimeOnSiteTracker();
        expect(Tos.isTimeOnSiteAllowed).to.equal(true);

        var Tos = new TimeOnSiteTracker(config);
        //expect(Tos.isTimeOnSiteAllowed).to.equal(false);

    });


    // it('Initialize TimeOnSiteTracker with trackHashBasedRouting param', function () {
    //      var config = {
    //         trackHashBasedRouting: true
    //     };

    //     // hash-based Url routing is false by default
    //     var Tos = new TimeOnSiteTracker();
    //     expect(Tos.trackHashBasedRouting).to.equal(false);

    //     var Tos = new TimeOnSiteTracker(config);
    //     expect(Tos.trackHashBasedRouting).to.equal(true);

    // });
});

describe('TimeOnSiteTracker with localstorage', function () {

    var data = {TOSId:1414865800771,TOSSessionKey:'14801413617947938061',
        URL:'http://tos-localdata.chennai/home.php',
        title:'Title of the document',entryTime:'2016-11-26T06:23:12.252Z',
        currentTime:'2016-11-26T06:23:18.320Z',timeOnPage:6,
        timeOnPageTrackedBy:'second',timeOnSite:46,trackingType:'tos',
        exitTime:'2016-11-26T06:23:18.320Z'
    };

    it('Check if localstorage saveToLocalStorage method works', function () {
        Tos.saveToLocalStorage(data);
    });

    it('Check if localstorage getDateKeys method works', function () {
        var dateKeys = Tos.getDateKeys();
        console.log('Test: keys...');
        console.log(dateKeys);
        expect(dateKeys).to.be.instanceof(Array);
        expect(dateKeys.length).to.be.at.least(0);
    });

    // it('Check if localstorage removeDateKey method works', function () {
    //     var dateKey = 'TOS_11_26_2016';
    //     Tos.removeDateKey(dateKey);
    //     var dateKeys = Tos.getDateKeys();
    //     expect(dateKeys.length).to.equal(0);
    // });

    it('Check if localstorage processDataInLocalStorage method works', function () {
        var data = [
            {
                TOSId:1414865800771,TOSSessionKey:'14801413617947938061',
                URL:'http://tos-localdata.chennai/home.php',
                title:'Title of the document',entryTime:'2016-11-26T06:23:12.252Z',
                currentTime:'2016-11-26T06:23:18.320Z',timeOnPage:6,
                timeOnPageTrackedBy:'second',timeOnSite:46,trackingType:'tos',
                exitTime:'2016-11-26T06:23:18.320Z'
            },
            {
                TOSId:1414865800881,TOSSessionKey:'14801413617947938061',
                URL:'http://tos-localdata.chennai/home.php',
                title:'Title of the document',entryTime:'2016-11-26T06:23:12.252Z',
                currentTime:'2016-11-26T06:23:18.320Z',timeOnPage:6,
                timeOnPageTrackedBy:'second',timeOnSite:46,trackingType:'tos',
                exitTime:'2016-11-26T06:23:18.320Z'
            }
        ];
        Tos.saveToLocalStorage(data);

        Tos.processDataInLocalStorage();
    });
    

});
