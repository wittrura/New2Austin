$(document).ready(function() {
    $('select').material_select();

    document.getElementById('show-crimes').addEventListener('click', showCrimes);
    // document.getElementById('hide-crimes').addEventListener('click', function() {
    //   hideMarkers(crimeMarkers);
    // });
    document.getElementById('hide-crimes').addEventListener('click', resetMarkers);

    document.getElementById('toggle-drawing').addEventListener('click', function() {
      toggleDrawing(drawingManager);
    });

    drawingManager.addListener('overlaycomplete', function(e) {
      activateDrawingMarkers(e);
    });

    document.getElementById('zoom-to-places-go').addEventListener('click', zoomToPlaces);


    let zoomAutocomplete = new google.maps.places.Autocomplete(document.getElementById('zoom-to-places'));
    zoomAutocomplete.bindTo('bounds', map);

    // search box, more wide-reaching version of autocomplete. able to search places
    // bias the SearchBox results towards current map's viewport.
    let searchBox = new google.maps.places.SearchBox(document.getElementById('search-nearby-places'));
    searchBox.setBounds(map.getBounds());
    map.addListener('bounds_changed', function() {
      searchBox.setBounds(map.getBounds());
    });

    // listen for user selecting a suggested place and clicking directly
    searchBox.addListener('places_changed', function() {
      searchBoxPlaces(this);
    });

    // listen for user clicking go when searching for places
    document.getElementById('search-nearby-places-go').addEventListener('click', textSearchPlaces);

    //
    document.getElementById('toggleStandard').addEventListener('click', toggleStandard);
    document.getElementById('toggleCluster').addEventListener('click', toggleCluster);
    document.getElementById('toggleHeatmap').addEventListener('click', toggleHeatmap);

    //
    document.getElementById('crimeType-go').addEventListener('click', function(e) {
      filterCrimeMarkersType(document.getElementById('crimeType').value);
    });
});


// instantiate map, blank array for all crimes markers
let map = null;
let crimeMarkers = [];
let largeInfowindow = null;
let drawingManager = null;
let polygon = null;

//
let markerCluster = null;

//
let heatMap = null;
let heatMapData = [];

// separate from crime markers, these will be for searching places
let placeMarkers = [];

// to store full list of data from API
let locations = null;


// intialize map object with default properties
function initMap() {
  const AUSTIN = {lat: 30.2672, lng: -97.7431};
  // set high level zoom on austin - higher zoom number is lower to the ground
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 10,
    center: AUSTIN
  });

  // instantiate infowindow
  largeInfowindow = new google.maps.InfoWindow();


  // request crime locations from API endpoint
  $.get('http://localhost:5000/json', function(data) {
    locations = data;
  }).done(function() {
    // loop through locations array to create markers for crimes on initialization
    // TODO - only loading 50 crimes based on response times, update to locations.length
    for (var i = 0; i < 50; i++) {
      let position = locations[i].location;
      let title = locations[i].crimeType;

      // create a new marker for each location
      let marker = new google.maps.Marker({
        position: position,
        title: title,
        animation: google.maps.Animation.DROP,
        id: i,
        date: new Date(locations[i].date * 1000),
        reportNum: locations[i].reportNum
      });
      // add to markers array
      crimeMarkers.push(marker);

      // add listeners to open infowindow with crime details on click
      marker.addListener('click', function() {
        populateInfoWindow(this, largeInfowindow);
      });

      let latLng = new google.maps.LatLng(locations[i].location.lat, locations[i].location.lng);
      heatMapData.push(latLng);

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

  // initialize heatmap layer
  heatmap = new google.maps.visualization.HeatmapLayer({
    data: heatMapData,
    dissipating: true,
    map: map,
    radius: 50,
    opacity: .5
  });
  heatmap.setMap(null);

}


// populates infowindow when a marker is clicked
// only one infowindow allowed open at a time
// data is populated based on markers position
function populateInfoWindow(marker, infowindow) {
  // check that the infowindow is not already opened on this marker
  if (infowindow.marker != marker) {
    let formattedReportNum = `${marker.reportNum.substring(0,4)}-${marker.reportNum.substring(4)}`
    infowindow.marker = marker;
    infowindow.setContent(`
      <div>${marker.title}</div>
      <div>Date: ${marker.date}</div>
      <div>Report Number:
        <a target='_blank' href='https://www.ci.austin.tx.us/police/reports/search2.cfm?choice=caseno&caseno=${formattedReportNum}&Submit=Submit'>
        ${formattedReportNum}</a>
      </div>
      `);
    infowindow.open(map, marker);

    // clear marker property if an infowindow is closed
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
    });
  }
}


// loop through markers and display all
function showCrimes(fitBounds = true) {
  // instantiate map boundaries
  let bounds = new google.maps.LatLngBounds();

  for (var i = 0; i < crimeMarkers.length; i++) {
    crimeMarkers[i].setMap(map);
    // extend map boundaries for each marker
    bounds.extend(crimeMarkers[i].position);
  }

  // update map to new boundaries
  if (fitBounds) {
    map.fitBounds(bounds);
  }
}

// hides arrays of markers
function hideMarkers(markers) {
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


// handles drawing tools
function activateDrawingMarkers(event) {
  // if there is an existing polygon, get rid of it and remove the markers
  if (polygon) {
    polygon.setMap(null);
    hideMarkers(crimeMarkers);
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
  for (var i = 0; i < crimeMarkers.length; i++) {
    if (google.maps.geometry.poly.containsLocation(crimeMarkers[i].position, polygon)) {
      crimeMarkers[i].setMap(map);
    } else {
      crimeMarkers[i].setMap(null);
    }
  }
}


// update map view based on user input for a specific address, area, or place
function zoomToPlaces() {
  let geocoder = new google.maps.Geocoder();
  let address = document.getElementById('zoom-to-places').value;

  // prompt if input box is empty
  if (address == '') {
    window.alert('Please enter an area, place, or address');
  } else {

    // geocode it to get lat lng
    geocoder.geocode({
      address: address
    }, function(results, status) {
      if (status == 'OK') {
        // if response is successful, update map center and zoom in
        map.setCenter(results[0].geometry.location);
        map.setZoom(14);
      } else {
        window.alert('There was an error connecting to the server. Please try again');
      }
    });
  }
}


// executes if user enters text to search places and clicks a suggestion
function searchBoxPlaces(searchBox) {
  hideMarkers(placeMarkers);

  let places = searchBox.getPlaces();
  createMarkersForPlaces(places);

  if (places.length === 0) {
    window.alert('We did not find any places matching that request');
  }
}

// executes if user enters text to search places and clicks 'go'
function textSearchPlaces() {
  let bounds = map.getBounds();
  hideMarkers(placeMarkers);

  let placesService = new google.maps.places.PlacesService(map);
  let searchText = document.getElementById('search-nearby-places').value;
  placesService.textSearch({
    // bias the search to be within 1000m of the center of the map
    location: map.getCenter(),
    radius: 1000,
    query: searchText,
    bounds: bounds
  }, function(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      createMarkersForPlaces(results);
    }
  });
}


function createMarkersForPlaces(places) {
  let bounds = new google.maps.LatLngBounds();
  for (var i = 0; i < places.length; i++) {
    let place = places[i];
    let icon = {
      url: place.icon,
      size: new google.maps.Size(35, 35),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(15, 34),
      scaledSize: new google.maps.Size(25, 25)
    };

    let marker = new google.maps.Marker({
      map: map,
      icon: icon,
      title: place.name,
      position: place.geometry.location,
      id: place.id
    });
    placeMarkers.push(marker);

    if (place.geometry.viewport) {
      bounds.union(place.geometry.viewport);
    } else {
      bounds.extend(place.geometry.location);
    }
  }
  map.fitBounds(bounds);
}


// hide and show markers as different views
// options are standard, clustered, or heatmap
// resets view before setting to a new one
function toggleHeatmap() {
  resetMarkers();
  heatmap.setMap(map);
}

function toggleCluster() {
  resetMarkers();
  markerCluster = new MarkerClusterer(map, crimeMarkers, {imagePath: '../m'});
  showCrimes(false);
}

function toggleStandard() {
  resetMarkers();
  showCrimes(false);
}

// disable layers and hides crimeMarkers
function resetMarkers() {
  hideMarkers(crimeMarkers);
  if (markerCluster) {
    markerCluster.clearMarkers();
  }
  heatmap.setMap(null);
}


// filter the full locations array of all crimes by crime type
function filterCrimeMarkersType(crimeCode) {
  let filteredLocations = [];

  // default case, to return all locations unfiltered
  if (crimeCode === '7') {
    return locations;
  }

  // push to filtered array based on crime code
  locations.forEach(function(location) {
    switch (crimeCode) {
      // sex and rape
      case '1':
        if (location.crimeType.search(/sex|rape/i) > -1) {
          filteredLocations.push(location);
        }
        break;
      // theft and burglary
      case '2':
        if (location.crimeType.search(/burgl|theft|tress/i) > -1) {
          filteredLocations.push(location);
        }
        break;
      // assault
      case '3':
        if (location.crimeType.search(/assault|aslt/i) > -1) {
          filteredLocations.push(location);
        }
        break;
      // possession
      case '4':
        if (location.crimeType.search(/poss/i) > -1) {
          filteredLocations.push(location);
        }
        break;
      // driving
      case '5':
        if (location.crimeType.search(/dui|dwi|driving/i) > -1) {
          filteredLocations.push(location);
        }
        break;
      // other
      case '6':
      default:
        filteredLocations.push(location);
    }
  });
  console.log(filteredLocations);
  updateCrimeMarkers(filteredLocations);
}


// updates array of crime markers after filtering by type or date
function updateCrimeMarkers(newLocations) {
  // sets all individual markers to not be assigned to a map
  hideMarkers(crimeMarkers);
  // remove all references to previous markers, full delete
  crimeMarkers = [];

  for (var i = 0; i < newLocations.length; i++) {
    let position = newLocations[i].location;
    let title = newLocations[i].crimeType;

    // create a new marker for each location
    let marker = new google.maps.Marker({
      position: position,
      title: title,
      animation: google.maps.Animation.DROP,
      id: i,
      date: new Date(locations[i].date * 1000),
      reportNum: locations[i].reportNum
    });
    // add to markers array
    crimeMarkers.push(marker);

    // add listeners to open infowindow with crime details on click
    marker.addListener('click', function() {
      populateInfoWindow(this, largeInfowindow);
    });

    let latLng = new google.maps.LatLng(newLocations[i].location.lat, newLocations[i].location.lng);
    heatMapData.push(latLng);

  }
  showCrimes();
}
