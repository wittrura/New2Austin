var express = require('express');
const fs = require('fs');

var app = express();


app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});



// get convert data from API output to usable JSON object
// with only the required fields
var json = JSON.parse(fs.readFileSync('./public/apd_ytd.json', 'utf8'));

let cleanData = [];
json.data.forEach((datum) => {
  cleanData.push({
    reportNum: datum[8],
    crimeType: datum[9],
    date: datum[10],
    address: datum[13],
    location: {lat: datum[15],
               lng: datum[14]
             }
  });
});

// create separate array for incidents with lat/lng for easier use on google
let incidentsLatLng = [];
cleanData.forEach((incident) => {
  if (incident.location.lat && incident.location.lng) {
    incidentsLatLng.push(incident);
  }
});

app.get('/json', function(request, response) {
  response.writeHead(200, {"Content-Type": "application/json"});
  let json = JSON.stringify(incidentsLatLng);

  response.end(json);
});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
