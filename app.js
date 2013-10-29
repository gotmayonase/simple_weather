var APIKEY = 'f54e20e4a9969502845b541885b4165b'
var express = require('express');
var Forecast = require('forecast.io');
var app = express();
forecast = new Forecast({APIKey: APIKEY});

app.use(express.static(__dirname + '/public'));
app.use(express.logger());

app.get('/forecast/:latitude,:longitude', function(request,response) {
	forecast.get(request.params.latitude, request.params.longitude, { units: 'auto' },function(err, res, data) {
		if (err) throw err;
		response.send(data);
	})
});

app.listen(3000);
console.log('Listening on port 3000');