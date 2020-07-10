# TimeOnSiteTracker.JS

 * **timeonsitetracker.js** tracks time spent on page by user session.
 * It exposes getTimeOnPage() API which gives back time spent so far on page. Call it any time to get current page's time on page(TOP)
 * Unprecedented accuracy (user's browser tab presence only) and detailed time on site information
 * Provides support for blacklisting URL from tracking time on site(TOS)
 * Measure your user's interaction with site directly and accurately.
 * Most Reliable and stable APIs to measure time on site metric consistently
 * Multi-tab browser session accuracy and pageview capture
 * Modern browsers result in most accuracy compared with older browsers when using timeonsitetracker.js
 * timeonsitetracker.js is commercial software with restricted free use options

## Real-time Demo 
[https://saleemkce.github.io/timeonsite](https://saleemkce.github.io/timeonsite)

## Detailed Statistics - Time On Page
```
{
    TOSId: 1129620185532,
    TOSSessionKey: "14802525481391382263",
    TOSUserId: "anonymous",
    title: "Blog application - Nature & Wildlife",
    URL: "http://tos-localdata.chennai/home.php"
    entryTime: "2012-11-27 13:15:48.663",
    exitTime: "2012-11-27 13:17:31.663",
    timeOnPage: 103,
    timeOnSite: 103,
    timeOnPageTrackedBy: "second",
    timeOnPageByDuration: "0d 00h 01m 43s",
    timeOnSiteByDuration: "0d 00h 01m 43s",
    trackingType: "tos",
}
```
## 1-minute integration with jsDelivr
```
<script type="text/javascript">
var Tos;
(function(d, s, id, file) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s);
    js.id = id;
    js.onload = function() {
        var config = {
            trackBy: 'seconds',
            developerMode: true
        };
        if(TimeOnSiteTracker) {
            Tos = new TimeOnSiteTracker(config);
        }
    };
    js.src = file;fjs.parentNode.insertBefore(js, fjs);
 } (document, 'script', 'TimeOnSiteTracker', '//cdn.jsdelivr.net/gh/saleemkce/timeonsite@1.1.0/timeonsitetracker.min.js'));
</script>
```
* Place it just after starting &lt;head&gt; tag in your web app [https://cdn.jsdelivr.net/gh/saleemkce/timeonsite@1.1.0/timeonsitetracker.min.js](https://cdn.jsdelivr.net/gh/saleemkce/timeonsite@1.1.0/timeonsitetracker.min.js)

## Quick Integration Steps
[Documentation & Integration Steps](https://saleemkce.github.io/timeonsite/docs/index.html)
  
## Reports & Analytics Dashboard
[https://github.com/saleemkce/visual](https://github.com/saleemkce/visual)

## Timeonsite Analytics
[Advanced querying of timeonsite & page visit duration metrics with SQL](https://github.com/saleemkce/timeonsite_analytics)
![timeonsite analytics](https://cdn-images-1.medium.com/max/800/1*OAOuhlJIMIwWozepACzSaA.png)

## Web & Mobile Browser Support
* Modern web and mobile browsers supported well; old browsers supported with less accuracy.

![Web Browser Support](https://raw.githubusercontent.com/saleemkce/timeonsite/master/src/public/img/web_browsers.jpg "Web Browser Support")

![Mobile Browser Support](https://raw.githubusercontent.com/saleemkce/timeonsite/master/src/public/img/mobile_browsers.jpg "Mobile Browser Support")

## Release Notes
[https://saleemkce.github.io/timeonsite/docs/releases.html](https://saleemkce.github.io/timeonsite/docs/releases.html)