$(document).ready(function() {
    $('select').material_select();

    document.getElementById('show-crimes').addEventListener('click', showCrimes);
    document.getElementById('hide-crimes').addEventListener('click', hideCrimes);
    document.getElementById('toggle-drawing').addEventListener('click', function() {
      toggleDrawing(drawingManager);
    });

    drawingManager.addListener('overlaycomplete', function(e) {
      activateDrawingMarkers(e);
    });
});


// instantiate map, blank array for all crimes markers
let map = null;
let markers = [];
let drawingManager = null;
let polygon = null;


// intialize map object with default properties
function initMap() {
  const AUSTIN = {lat: 30.2672, lng: -97.7431};
  // set high level zoom on austin - higher zoom number is lower to the ground
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 10,
    center: AUSTIN
  });


  // instantiate infowindow
  let largeInfowindow = new google.maps.InfoWindow();


  let locations = null;
  // request crime locations from API endpoint
  $.get('http://localhost:5000/json', function(data) {
    locations = data;
  }).done(function() {
    // loop through locations array to create markers for crimes on initialization
    // TODO - only loading 50 crimes based on response times, update to locations.length
    for (var i = 0; i < 10; i++) {
      let position = locations[i].location;
      let title = locations[i].crimeType;

      // create a new marker for each location
      let marker = new google.maps.Marker({
        position: position,
        title: title,
        animation: google.maps.Animation.DROP,
        id: i
      });
      // add to markers array
      markers.push(marker);

      // add listeners to open infowindow with crime details on click
      marker.addListener('click', function() {
        populateInfoWindow(this, largeInfowindow);
      });
    }
  });


  // initialize the drawing manager
  drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.POLYGON,
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_LEFT,
      drawingModes: [
        google.maps.drawing.OverlayType.POLYGON
      ]
    }
  });

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

// loop through markers and display all
function showCrimes() {
  // instantiate map boundaries
  let bounds = new google.maps.LatLngBounds();

  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
    // extend map boundaries for each marker
    bounds.extend(markers[i].position);
  }
  // update map to new boundaries
  map.fitBounds(bounds);
}

function hideCrimes() {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
}


// shows and hides drawing options
function toggleDrawing(drawingManger) {
  if (drawingManager.map) {
    drawingManager.setMap(null);
    if (polygon) {
      // removes polygon but leaves markers
      polygon.setMap(null);
    }
  } else {
    drawingManager.setMap(map);
  }
}


// handles
function activateDrawingMarkers(event) {
  // if there is an existing polygon, get rid of it and remove the markers
  if (polygon) {
    polygon.setMap(null);
    hideCrimes();
  }
  // switch drawing mode to HAND and end drawing
  drawingManager.setDrawingMode(null);

  // update polygon based on the event overlay
  polygon = event.overlay;
  polygon.setEditable(true);

  // search area inside polygon, and redo search if it is changed
  searchWithinPolygon();
  polygon.getPath().addListener('set_at', searchWithinPolygon);
  polygon.getPath().addListener('insert_at', searchWithinPolygon);
}


// hides all markers outside polygon, and shows markers within
function searchWithinPolygon() {
  for (var i = 0; i < markers.length; i++) {
    if (google.maps.geometry.poly.containsLocation(markers[i].position, polygon)) {
      markers[i].setMap(map);
    } else {
      markers[i].setMap(null);
    }
  }
}
