$(document).ready(function() {
    $('select').material_select();
});

var locations = [
        {lat: 30.3312282, lng: -97.62328346},
        {lat: 30.38949131, lng: -97.64854574},
        {lat: 30.30960673, lng: -97.65506085},
        {lat: 30.37243668, lng: -97.66574384}
];

// instantiance map object with default properties
function initMap() {
  var austin = {lat: 30.2672, lng: -97.7431};
  // set high level zoom on austin - higher zoom number is lower to the ground
  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 10,
    center: austin
  });

  // var marker = new google.maps.Marker({
  //   position: austin,
  //   map: map
  // });

  var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  // loop through locations array aka seed data to create markers
  var markers = locations.map((location, i) => {
    return new google.maps.Marker({
      position: location,
      label: labels[i % labels.length]
    });
  });

  // add a clusterer to manage the markers
  var markerCluster = new MarkerClusterer(map, markers,
    {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});
}
