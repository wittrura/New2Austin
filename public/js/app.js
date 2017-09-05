$(document).ready(function() {
    $('select').material_select();


});


// MOCK DATA
// TODO replace with real crime objects - lat, lng, crime type
let locations = [
  {location: {lat: 30.3312282, lng: -97.62328346}, crimeType: 'ROBBERY BY ASSAULT', date: '06/04/2016'},
  {location: {lat: 30.38949131, lng: -97.64854574}, crimeType:'HARASSMENT', date: '02/06/2016'},
  {location: {lat: 30.30960673, lng: -97.65506085}, crimeType:'POSS CONTROLLED SUB/NARCOT', date: '08/08/2016'},
  {location: {lat: 30.37243668, lng: -97.66574384}, crimeType:'PUBLIC INTOXICATION', date: '08/06/2016'}
];


let map = null;

// intialize blank array for all crimes markers
let markers = [];


// instantiance map object with default properties
function initMap() {
  const AUSTIN = {lat: 30.2672, lng: -97.7431};
  // set high level zoom on austin - higher zoom number is lower to the ground
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 10,
    center: AUSTIN
  });

  // initialize infowindow, and map boundaries
  let largeInfowindow = new google.maps.InfoWindow();
  let bounds = new google.maps.LatLngBounds();

  // loop through locations array to create markers for crimes on initialization
  for (var i = 0; i < locations.length; i++) {
    let position = locations[i].location;
    let title = locations[i].crimeType;

    // create a new marker for each location
    let marker = new google.maps.Marker({
      position: position,
      map: map,
      title: title,
      animation: google.maps.Animation.DROP,
      id: i
    });
    // add to markers array
    markers.push(marker);

    // extend map boundaries for each marker
    bounds.extend(marker.position);

    // add listeners to open infowindow with crime details on click
    marker.addListener('click', function() {
      populateInfoWindow(this, largeInfowindow);
    });
  }
  // update map to new boundaries
  map.fitBounds(bounds);

}

// populates infowindow when a marker is clicked
// only one infowindow allowed open at a time
// data is populated based on markers position
function populateInfoWindow(marker, infowindow) {
  // check that the infowindow is not already opened on this marker
  if (infowindow.marker != marker) {
    infowindow.marker = marker;
    infowindow.setContent('<div>' + marker.title + '</div>');
    infowindow.open(map, marker);

    // clear marker property if an infowindow is closed
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
    });
  }
}
