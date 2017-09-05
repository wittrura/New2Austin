const fs = require('fs');

var json = JSON.parse(fs.readFileSync('../apd_ytd.json', 'utf8'));

let cleanData = [];
// 8 incident report num
// 9 crime type
// 10 date
// 13 address
// 14 long
// 15 lat
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
console.log(cleanData[0]);

// create separate array for incidents with lat/lng for easier use on google
let incidentsLatLng = [];
cleanData.forEach((incident) => {
  if (incident.location.lat && incident.location.lng) {
    incidentsLatLng.push(incident);
  }
});
console.log(incidentsLatLng.length);
console.log(incidentsLatLng[0]);
