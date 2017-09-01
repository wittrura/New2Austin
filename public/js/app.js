$(document).ready(function() {
    $('select').material_select();


    document.getElementById('landmark-btn').addEventListener('click', function() {
          zoomToArea();
        });

    var zoomAutocomplete = new google.maps.places.Autocomplete(
     document.getElementById('landmark'));
});

var locations = [
        {lat: 30.3312282, lng: -97.62328346},
        {lat: 30.38949131, lng: -97.64854574},
        {lat: 30.30960673, lng: -97.65506085},
        {lat: 30.37243668, lng: -97.66574384}
];


var map;
var service;
var infowindow;

// instantiance map object with default properties
function initMap() {
  var austin = {lat: 30.2672, lng: -97.7431};
  // set high level zoom on austin - higher zoom number is lower to the ground
  map = new google.maps.Map(document.getElementById('map'), {
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
    {imagePath: '../m'});

  let heatmapData = [];

  for (var i = 0; i < locations.length; i++) {
    var latLng = new google.maps.LatLng(locations[i].lat, locations[i].lng);
    heatmapData.push(latLng);
  }

  // var heatmap = new google.maps.visualization.HeatmapLayer({
  //    data: heatmapData,
  //    dissipating: false,
  //    map: map
  //  });

  infowindow = new google.maps.InfoWindow();
  service = new google.maps.places.PlacesService(map);

  // service.nearbySearch({
  //   location: austin,
  //   radius: 500,
  //   type: ['gym']
  //  }, callback);

  // 
  var request = {
    location: austin,
    radius: '500',
    query: 'apartments'
  };

  // service = new google.maps.places.PlacesService(map);
  service.textSearch(request, callback);
}


// create markers based on results of service calls
function callback(results, status) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      createMarker(results[i]);
    }
  }
}

//
function createMarker(place) {
  var placeLoc = place.geometry.location;
  var marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location
  });

  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent(place.name);
    infowindow.open(map, this);
  });
}





// takes the input value in the find nearby area text input, locates it, then zooms to area
// this is so the user can show all listing, then decide to focus on one area of the map
function zoomToArea() {
  // initialize the geocoder
  var geocoder = new google.maps.Geocoder();
  // get the address or place that the user entered
  var address = document.getElementById('landmark').value;
  // make sure the address isn't blank
  if (address == '') {
    window.alert('You must enter an area, or address.');
  } else {
    // geocode the address or area entered to get the center
    // then center the map on it and zoom in
    geocoder.geocode({
      address: address,
      componentRestrictions: {locality: 'Austin'}
    }, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        map.setCenter(results[0].geometry.location);
        map.setZoom(12);
      } else {
        window.alert('We could not find that location - try entering a more specific place');
      }
    });
  }
}
