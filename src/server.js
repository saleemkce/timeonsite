var express = require('express')
var app = express()
var path = require('path')

app.use('/static', express.static(path.join(__dirname, 'public')))
//app.use('/static', express.static(path.join(__dirname, 'test')))

app.get('/', function (req, res) {
  res.send('Hello World!')
});

app.listen(3000, function () {
  console.log('TimeOnSiteTracker sample node app running on port 3000!')
});
