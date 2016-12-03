// give your endpoint URL/ server-side URL that is going to handle your TOS data
// which is of POST method. Eg. PHP, nodejs or python URL which saves this data to your DB
var endPointUrl = 'http://localhost:4500/data/tos';

var config = {
    trackBy: 'seconds',
    callback: function(data) {
        console.log(data);

        if(data && data.trackingType) {
            
            // make use of sendBeacon if this API is supported by your browser
            if(navigator && typeof navigator.sendBeacon === 'function'){
                //var debug = data;
                data.transferredWith = 'sendBeacon';
                var blob = new Blob([JSON.stringify(data)], {type : 'application/json'});
                navigator.sendBeacon(endPointUrl, blob);
            } else {

                // XMLHttpRequest begins..
                var params = JSON.stringify(data),
                    xhr;

                if (window.XMLHttpRequest) {
                    xhr = new XMLHttpRequest();
                } else { // code for IE6, IE5
                    xhr = new ActiveXObject('Microsoft.XMLHTTP');
                }

                xhr.open('POST', endPointUrl, false); //synchronous call; changing this to true will make it
                //asynchronous request and data won't be saved in your DB.

                //Send the proper header information along with the request
                xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

                xhr.onreadystatechange = function() {//Call a function when the state changes.
                    if(xhr.readyState == 4 && xhr.status == 200) {
                        if(xhr.responseText == 'success') {
                            console.log('Data saved successfully!');
                            //Warning: But you should not do more operations here since it will block
                            //user from closing the application or slow down site navigation
                        } 
                    }
                }
                xhr.send(params);
                // XMLHttpRequest ends..
                
            }
            
        }
        
    }};
var Tos = new TimeOnSiteTracker(config);
