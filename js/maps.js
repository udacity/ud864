var map;

// Create a new blank array for all the listing markers.
var markers = [];

// This global polygon variable is to ensure only ONE polygon is rendered.
var polygon = null;
var currentDrawingTool = null;

// Create placemarkers array to use in multiple functions to have control
// over the number of places that show.
var placeMarkers = [];

// Add Traffic Layers
var trafficLayer = null;
var transitLayer = null;
var bikeLayer = null;

// Route layers
var directionsDisplay = null;

// Place details
var currentPlace = null;
var currentPhoto = 0;

// Main entry point
function initMap() {
  // Create a styles array to use with the map.
  var styles = [
    {
      "featureType": "administrative",
      "elementType": "labels.text.fill",
      "stylers": [
        {
            "color": "#444444"
        }
      ]
    },
    {
      "featureType": "landscape",
      "elementType": "all",
      "stylers": [
        {
            "color": "#f2f2f2"
        }
      ]
    },
    {
      "featureType": "landscape.man_made",
      "elementType": "geometry.fill",
      "stylers": [
        {
            "lightness": "-10"
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "all",
      "stylers": [
        {
            "visibility": "off"
        }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "geometry.fill",
      "stylers": [
        {
            "color": "#5cb85c"
        },
        {
            "visibility": "on"
        },
        {
            "lightness": "50"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "all",
      "stylers": [
        {
            "saturation": -100
        },
        {
            "lightness": 45
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "all",
      "stylers": [
        {
            "visibility": "simplified"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "labels.icon",
      "stylers": [
        {
            "visibility": "off"
        }
      ]
    },
    {
      "featureType": "road.arterial",
      "elementType": "labels.icon",
      "stylers": [
        {
            "visibility": "off"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "all",
      "stylers": [
        {
            "color": "#91dcfa"
        },
        {
            "visibility": "on"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "geometry.fill",
      "stylers": [
        {
            "color": "#337ab7"
        }
      ]
    }
  ];

  var styledMapType = new google.maps.StyledMapType(
    styles,
    {name: 'Mono'}
  );

  // Constructor creates a new map - only center and zoom are required.
  map = new google.maps.Map($('#map')[0], {
      center: {lat: 40.7413549, lng: -73.9980244},
      zoom: 13,
      mapTypeControlOptions: {
        //style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        position: google.maps.ControlPosition.TOP_RIGHT,
        mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain', 'mono']
      }
  });
  map.mapTypes.set('mono', styledMapType);
  map.setMapTypeId('mono');

  // Set up traffic layers
  trafficLayer = new google.maps.TrafficLayer();
  transitLayer = new google.maps.TransitLayer();
  bikeLayer = new google.maps.BicyclingLayer();

  trafficLayer.setMap(null);
  transitLayer.setMap(null);
  bikeLayer.setMap(null);
  $('#toggle-traffic').on('click', toggleTraffic);
  $('#toggle-transit').on('click', toggleTransit);
  $('#toggle-bicycling').on('click', toggleBicycling);

  $('#directions-close-button').on('click', removeDirectionsPanel);

  // This autocomplete is for use in the search within time entry box.
  var timeAutocomplete = new google.maps.places.Autocomplete($('#search-within-time-text')[0]);

  // This autocomplete is for use in the geocoder entry box.
  var zoomAutocomplete = new google.maps.places.Autocomplete($('#zoom-to-area-text')[0]);

  // Bias the boundaries within the map for the zoom to area text.
  zoomAutocomplete.bindTo('bounds', map);

  // Create a searchbox in order to execute a places search
  var searchBox = new google.maps.places.SearchBox($('#places-search')[0]);

  // Bias the searchbox to within the bounds of the map.
  searchBox.setBounds(map.getBounds());

  // These are the real estate listings that will be shown to the user.
  // Normally we'd have these in a database instead.
  var locations = [
    {title: 'Park Ave Penthouse', location: {lat: 40.7713024, lng: -73.9632393}},
    {title: 'Chelsea Loft', location: {lat: 40.7444883, lng: -73.9949465}},
    {title: 'Union Square Open Floor Plan', location: {lat: 40.7347062, lng: -73.9895759}},
    {title: 'East Village Hip Studio', location: {lat: 40.7281777, lng: -73.984377}},
    {title: 'TriBeCa Artsy Bachelor Pad', location: {lat: 40.7195264, lng: -74.0089934}},
    {title: 'Chinatown Homey Space', location: {lat: 40.7180628, lng: -73.9961237}}
  ];

  var largeInfowindow = new google.maps.InfoWindow();

  // Initialize the drawing manager.
  var drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: false
  });

  // Style the markers a bit. This will be our listing marker icon.
  var defaultIcon = makeMarkerIcon('0091ff');

  // Create a "highlighted location" marker color for when the user
  // mouses over the marker.
  var highlightedIcon = makeMarkerIcon('ffff24');

  // The following group uses the location array to create an array of markers on initialize.
  for (var i = 0; i < locations.length; i++) {
    // Get the position from the location array.
    var position = locations[i].location;
    var title = locations[i].title;

    // Create a marker per location, and put into markers array.
    var marker = new google.maps.Marker({
      position: position,
      title: title,
      animation: google.maps.Animation.DROP,
      icon: defaultIcon,
      id: i
    });

    // Push the marker to our array of markers.
    markers.push(marker);

    // Create an onclick, mouseover and mouseout events to open the large
// infowindow at each marker.
    addMarkerEvents(marker, largeInfowindow, defaultIcon, highlightedIcon);
  }

  $('#toggle-listings').on('click', function() {
    toggleListings(markers);
  });

  $('#hand-tool').on('click', function() {
    disableDrawing(drawingManager);
  });

  $('#toggle-drawing-polygon').on('click', function() {
    toggleDrawing(drawingManager, google.maps.drawing.OverlayType.POLYGON, $(this));
  });
  $('#toggle-drawing-rectangle').on('click', function() {
    toggleDrawing(drawingManager, google.maps.drawing.OverlayType.RECTANGLE, $(this));
  });
  $('#toggle-drawing-circle').on('click', function() {
    toggleDrawing(drawingManager, google.maps.drawing.OverlayType.CIRCLE, $(this));
  });

  $('#zoom-to-area').on('click', zoomToArea);
  $('#search-within-time').on('click', searchWithinTime);

  // Listen for the event fired when the user selects a prediction from the
  // picklist and retrieve more details for that place.
  searchBox.addListener('places_changed', function() {
    searchBoxPlaces(this);
  });

  // Listen for the event fired when the user selects a prediction and clicks
  // "go" more details for that place.
  $('#go-places').on('click', textSearchPlaces);

  // Add an event listener so that the polygon is captured,  call the
  // searchWithinPolygon function. This will show the markers in the polygon,
  // and hide any outside of it.
  drawingManager.addListener('overlaycomplete', function(event) {
    // First, check if there is an existing polygon.
    // If there is, get rid of it and remove the markers
    if (polygon) {
      polygon.setMap(null);
      hideMarkers(markers);
    }

    // Switching the drawing mode to the HAND (i.e., no longer drawing).
    //drawingManager.setDrawingMode(null);

    // Creating a new editable polygon from the overlay.
    polygon = event.overlay;
    //polygon.setEditable(true);

    // Searching within the polygon.
    searchWithinPolygon(polygon, drawingManager);

    // Make sure the search is re-done if the poly is changed (only relevant if editable).
    //polygon.getPath().addListener('set_at', searchWithinPolygon);
    //polygon.getPath().addListener('insert_at', searchWithinPolygon);
  });
}

// Function to add events to a given marker.
function addMarkerEvents(marker, infoWindow, defaultIcon, highlightedIcon) {
  // Create an onclick event to open the large infowindow at each marker.
  marker.addListener('click', function() {
    populateInfoWindow(this, infoWindow);
  });

  // Two event listeners - one for mouseover, one for mouseout,
  // to change the colors back and forth.
  marker.addListener('mouseover', function() {
    this.setIcon(highlightedIcon);
  });
  marker.addListener('mouseout', function() {
    this.setIcon(defaultIcon);
  });
}

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {

  // In case the status is OK, which means the pano was found, compute the
  // position of the streetview image, then calculate the heading, then get a
  // panorama from that and set the options
  function getStreetView(data, status) {
    if (status == google.maps.StreetViewStatus.OK) {
      var nearStreetViewLocation = data.location.latLng;
      var heading = google.maps.geometry.spherical.computeHeading(nearStreetViewLocation, marker.position);
      infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
      var panoramaOptions = {
        position: nearStreetViewLocation,
        pov: {
          heading: heading,
          pitch: 30
        }
      };
      var panorama = new google.maps.StreetViewPanorama($('#pano')[0], panoramaOptions);
    } else {
      infowindow.setContent('<div>' + marker.title + '</div><div>No Street View Found</div>');
    }
  }

// Check to make sure the infowindow is not already opened on this marker.
  if (infowindow.marker != marker) {
    // Clear the infowindow content to give the streetview time to load.
    infowindow.setContent('');
    infowindow.marker = marker;

    // Make sure the marker property is cleared if the infowindow is closed.
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
    });
    var streetViewService = new google.maps.StreetViewService();
    var radius = 50;

    // Use streetview service to get the closest streetview image within
    // 50 meters of the markers position
    streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);

    // Open the infowindow on the correct marker.
    infowindow.open(map, marker);
  }
}

// Toggle the display of available listings.
function toggleListings(markers) {
  var listingButton = $('#toggle-listings');
  if (listingButton.hasClass('selected')) {
    listingButton.removeClass('selected');
    hideMarkers(markers);
  } else {
    listingButton.addClass('selected');
    showListings(markers);
  }
}

// This function will loop through the markers array and display them all.
function showListings(markers) {
  var bounds = new google.maps.LatLngBounds();
  // Extend the boundaries of the map for each marker and display the marker
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
    bounds.extend(markers[i].position);
  }
  map.fitBounds(bounds);
}

// This function will loop through the listings and hide them all.
function hideMarkers(markers) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
}

// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor + '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21,34));
  return markerImage;
}

// This shows and hides (respectively) the drawing options.
function toggleDrawing(drawingManager, drawingmode, caller) {
  $('#hand-tool').removeClass('selected');
  deselectDrawingTools();
  
  if (drawingManager.map && caller === currentDrawingTool) {
    drawingManager.setMap(null);
    // In case the user drew anything, get rid of the polygon
    if (polygon !== null) {
      polygon.setMap(null);
    }
  } else {
    drawingManager.setMap(map);
    drawingManager.setDrawingMode(drawingmode);
    if (polygon !== null) {
      polygon.setMap(null);
    }
    caller.addClass('selected');
    currentDrawingTool = caller;
  }
}

// Deselect all drawing tool icons.
function deselectDrawingTools() {
  $('#toggle-listings').removeClass('selected');
  $('#toggle-drawing-polygon').removeClass('selected');
  $('#toggle-drawing-rectangle').removeClass('selected');
  $('#toggle-drawing-circle').removeClass('selected');
}

// Disable drawing functions
function disableDrawing(drawingManager) {
  deselectDrawingTools();
  $('#hand-tool').addClass('selected');
  if (drawingManager.map) {
    drawingManager.setMap(null);
  }
  if (polygon !== null) {
    polygon.setMap(null);
  }
}

// This function hides all markers outside the polygon,
// and shows only the ones within it. This is so that the
// user can specify an exact area of search.
function searchWithinPolygon(polygon, drawingManager) {
  var markerCount = 0;
  for (var i = 0; i < markers.length; i++) {
    //if (google.maps.geometry.poly.containsLocation(markers[i].position, polygon)) {
    if (isWithinCurrentShape(markers[i].position, polygon)) {
      markers[i].setMap(map);
      markerCount++;
    } else {
      markers[i].setMap(null);
    }
  }
  deselectDrawingTools();
  if (markerCount > 0) {
    $('#toggle-listings').addClass('selected');
  } else {
    $('#toggle-listings').removeClass('selected');
  }
  $('#hand-tool').addClass('selected');
  if (drawingManager.map) {
    drawingManager.setMap(null);
  }
}

// Determine if a position is within the current drawing tool
function isWithinCurrentShape(position, shape) {
  var currentShape = currentDrawingTool[0].id;
  if (currentShape) {
    currentShape = currentShape.split('-').pop();
    if (currentShape === 'polygon') {
      return google.maps.geometry.poly.containsLocation(position, shape);
    }
    if (currentShape === 'rectangle') {
      return shape.getBounds().contains(position);
    }
    if (currentShape === 'circle') {
      return google.maps.geometry.spherical.computeDistanceBetween(position, shape.getCenter()) <= shape.getRadius();
    }
  }
  return false;
}

// This function takes the input value in the find nearby area text input
// locates it, and then zooms into that area. This is so that the user can
// show all listings, then decide to focus on one area of the map.
function zoomToArea() {
  // Initialize the geocoder.
  var geocoder = new google.maps.Geocoder();

  // Get the address or place that the user entered.
  var address = $('#zoom-to-area-text').val();

  // Make sure the address isn't blank.
  if (address === '') {
    window.alert('You must enter an area, or address.');
  } else {
    // Geocode the address/area entered to get the center. Then, center the map
    // on it and zoom in
    geocoder.geocode({
        address: address,
        componentRestrictions: {locality: 'New York'}
      }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          map.setCenter(results[0].geometry.location);
          map.setZoom(15);
        } else {
          window.alert('We could not find that location - try entering a more specific place.');
        }
      }
    );
  }
}

// This function allows the user to input a desired travel time, in
// minutes, and a travel mode, and a location - and only show the listings
// that are within that travel time (via that travel mode) of the location
function searchWithinTime() {
  // Initialize the distance matrix service.
  var distanceMatrixService = new google.maps.DistanceMatrixService();
  var address = $('#search-within-time-text').val();

  // Check to make sure the place entered isn't blank.
  if (address === '') {
    window.alert('You must enter an address.');
  } else {
    hideMarkers(markers);
    // Use the distance matrix service to calculate the duration of the
    // routes between all our markers, and the destination address entered
    // by the user. Then put all the origins into an origin matrix.
    var origins = [];
    for (var i = 0; i < markers.length; i++) {
      origins[i] = markers[i].position;
    }
    var destination = address;
    var mode = $('#mode').val();

    // Now that both the origins and destination are defined, get all the
    // info for the distances between them.
    distanceMatrixService.getDistanceMatrix({
        origins: origins,
        destinations: [destination],
        travelMode: google.maps.TravelMode[mode],
        unitSystem: google.maps.UnitSystem.IMPERIAL,
      }, function(response, status) {
        if (status !== google.maps.DistanceMatrixStatus.OK) {
          window.alert('Error was: ' + status);
        } else {
          displayMarkersWithinTime(response);
        }
      }
    );
  }
}

// This function will go through each of the results, and,
// if the distance is LESS than the value in the picker, show it on the map.
function displayMarkersWithinTime(response) {
  var maxDuration = $('#max-duration').val();
  var origins = response.originAddresses;
  var destinations = response.destinationAddresses;
  // Parse through the results, and get the distance and duration of each.
  // Because there might be  multiple origins and destinations we have a nested loop
  // Then, make sure at least 1 result was found.
  var atLeastOne = false;
  for (var i = 0; i < origins.length; i++) {
    var results = response.rows[i].elements;
    for (var j = 0; j < results.length; j++) {
      var element = results[j];
      if (element.status === "OK") {
        // The distance is returned in feet, but the TEXT is in miles. If we wanted to switch
        // the function to show markers within a user-entered DISTANCE, we would need the
        // value for distance, but for now we only need the text.
        var distanceText = element.distance.text;

        // Duration value is given in seconds so we make it MINUTES. We need both the value
        // and the text.
        var duration = element.duration.value / 60;
        var durationText = element.duration.text;
        if (duration <= maxDuration) {
          //the origin [i] should = the markers[i]
          markers[i].setMap(map);
          atLeastOne = true;

          // Create a mini infowindow to open immediately and contain the
          // distance and duration
          var infowindow = new google.maps.InfoWindow({
              content: durationText + ' away, ' + distanceText +
                '<div><input type="button" class="btn btn-default" value=\"View Route\" onclick =' +
                '"displayDirections(&quot;' + origins[i] + '&quot;);"></input></div>'
            }
          );
          infowindow.open(map, markers[i]);
          // Put this in so that this small window closes if the user clicks
          // the marker, when the big infowindow opens
          markers[i].infowindow = infowindow;
          google.maps.event.addListener(markers[i], 'click', function() { this.infowindow.close(); });
        }
      }
    }
  }
  if (!atLeastOne) { window.alert('We could not find any locations within that distance!'); }
}

// This function is in response to the user selecting "show route" on one
// of the markers within the calculated distance. This will display the route
// on the map.
function displayDirections(origin) {
  hideMarkers(markers);
  var directionsService = new google.maps.DirectionsService();
  // Get the destination address from the user entered value.
  var destinationAddress = $('#search-within-time-text').val();
  // Get mode again from the user entered value.
  var mode = $('#mode').val();
  directionsService.route({
      // The origin is the passed in marker's position.
      origin: origin,
      // The destination is user entered address.
      destination: destinationAddress,
      travelMode: google.maps.TravelMode[mode]
    }, function(response, status) {
      if (status === google.maps.DirectionsStatus.OK) {
        if (directionsDisplay) clearExistingDirections();
        directionsDisplay = new google.maps.DirectionsRenderer({
            map: map,
            directions: response,
            draggable: true,
            polylineOptions: {
              strokeColor: 'green'
            }
          }
        );
        populateDirectionsPanel(response);
        $('#directions-panel').show(200);

        directionsDisplay.addListener('directions_changed', function(){
          populateDirectionsPanel(directionsDisplay.getDirections());
        });
      } else {
        window.alert('Directions request failed due to ' + status);
      }
    }
  );
}

// Clear the existing directions from the map so that new directions don't
// get too cluttered.
function clearExistingDirections() {
  directionsDisplay.setMap(null);
}

// Display directions in a separate panel
function populateDirectionsPanel(directions) {
  var steps = directions.routes[0].legs[0].steps;
  var distance = directions.routes[0].legs[0].distance;
  var duration = directions.routes[0].legs[0].duration;

  var text = '<strong>From:</strong> ' + directions.request.origin;
  text += '<br><strong>To:</strong> ' + directions.request.destination;
  text += '<br><strong>Total Journey:</strong> ' + distance.text;
  text += ' (about ' + duration.text + ')';
  text += '<ul class="list-group top-row-margin">';

  for (var i=0; i<steps.length; i++) {
    var stepDistance = steps[i].distance;
    var stepDuration = steps[i].duration;
    var maneuver = steps[i].maneuver;

    text += '<li class="list-group-item">' +
      '<div class="row"><div class="col-md-2">' +
      getManeuverIcon(maneuver) +
      '</div>' +
      '<div class="col-md-10">' +
      steps[i].instructions +
      '<div class="text-right"><small>Travel for ' +
      stepDistance.text +
      ' (' +
      stepDuration.text +
      ')</small></div></div></div></li>';
  }
  text += '</ul>';

  $('#directions').html(text);
}

// Function to retrieve an appropriate icon for a given maneuver
function getManeuverIcon(maneuver) {
  switch(maneuver) {
    case 'turn-left':
      return '<span class="glyphicon glyphicon-arrow-left" aria-hidden="true"></span>';
    case 'turn-right':
      return '<span class="glyphicon glyphicon-arrow-right" aria-hidden="true"></span>';
    default:
      return '';
  }
}

// Remove the directions panel
function removeDirectionsPanel() {
  if (directionsDisplay) clearExistingDirections();
  $('#directions-panel').hide(200);
  searchWithinTime();
}

// This function fires when the user selects a searchbox picklist item.
// It will do a nearby search using the selected query string or place.
function searchBoxPlaces(searchBox) {
  hideMarkers(placeMarkers);
  var places = searchBox.getPlaces();
  if (places.length === 0) {
    window.alert('We did not find any places matching that search!');
  } else {
    // For each place, get the icon, name and location.
    createMarkersForPlaces(places);
  }
}

// This function firest when the user select "go" on the places search.
// It will do a nearby search using the entered query string or place.
function textSearchPlaces() {
  var bounds = map.getBounds();
  hideMarkers(placeMarkers);
  var placesService = new google.maps.places.PlacesService(map);
  placesService.textSearch({
      query: $('#places-search').val(),
      bounds: bounds
    }, function(results, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        createMarkersForPlaces(results);
      }
    }
  );
}

// This function creates markers for each place found in either places search.
function createMarkersForPlaces(places) {
  var bounds = new google.maps.LatLngBounds();
  for (var i = 0; i < places.length; i++) {
    var place = places[i];
    var icon = {
      url: place.icon,
      size: new google.maps.Size(35, 35),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(15, 34),
      scaledSize: new google.maps.Size(25, 25)
    };
    // Create a marker for each place.
    var marker = new google.maps.Marker({
        map: map,
        icon: icon,
        title: place.name,
        position: place.geometry.location,
        id: place.place_id
      }
    );
    // Create a single infowindow to be used with the place details information
    // so that only one is open at once.
    var placeInfoWindow = new google.maps.InfoWindow();

    // If a marker is clicked, do a place details search on it in the next function.
    //marker.addListener('click', function() {
    //   if (placeInfoWindow.marker == this) {
    //      console.log("This infowindow already is on this marker!");
    //    } else {
    //      getPlacesDetails(this, placeInfoWindow);
    //    }
    //  }
    //);
addPlaceMarkerEvents(marker, placeInfoWindow);
    placeMarkers.push(marker);
    if (place.geometry.viewport) {
      // Only geocodes have viewport.
      bounds.union(place.geometry.viewport);
    } else {
      bounds.extend(place.geometry.location);
    }
  }
  map.fitBounds(bounds);
}

// Function to add an event to a place marker.
function addPlaceMarkerEvents(marker, infowindow) {
  // If a marker is clicked, do a place details search on it in the next function.
  marker.addListener('click', function() {
      if (infowindow.marker == this) {
        console.log("This infowindow already is on this marker!");
      } else {
        getPlacesDetails(this, infowindow);
      }
    }
  );
}

// This is the PLACE DETAILS search - it's the most detailed so it's only
// executed when a marker is selected, indicating the user wants more
// details about that place.
function getPlacesDetails(marker, infowindow) {
  var service = new google.maps.places.PlacesService(map);
  service.getDetails({
      placeId: marker.id
    }, function(place, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        // Set the marker property on this infowindow so it isn't created again.
        infowindow.marker = marker;
        var innerHTML = '<div>';
        if (place.name) {
          innerHTML += '<strong>' + place.name + '</strong>';
        }
        if (place.formatted_address) {
          innerHTML += '<br>' + place.formatted_address;
        }
        if (place.formatted_phone_number) {
          innerHTML += '<br>' + place.formatted_phone_number;
        }
        if (place.opening_hours) {
          innerHTML += '<br><br><strong>Hours:</strong><br>' +
            place.opening_hours.weekday_text[0] + '<br>' +
            place.opening_hours.weekday_text[1] + '<br>' +
            place.opening_hours.weekday_text[2] + '<br>' +
            place.opening_hours.weekday_text[3] + '<br>' +
            place.opening_hours.weekday_text[4] + '<br>' +
            place.opening_hours.weekday_text[5] + '<br>' +
            place.opening_hours.weekday_text[6];
        }
        if (place.photos) {
          innerHTML += '<br><br><img id="' + place.id + '_photo" src="' + place.photos[0].getUrl(
            {maxHeight: 100, maxWidth: 200}) + '">';
          if (place.photos.length > 1)
          {
            innerHTML += '<br>';
            innerHTML += place.photos.length + ' photos: ';
            innerHTML += '<a onclick="previousPhoto()">Prev</a> ';
            innerHTML += '<a onclick="nextPhoto()">Next</a>';           
          }
        }
        innerHTML += '</div>';
        infowindow.setContent(innerHTML);
        currentPlace = place;
        infowindow.open(map, marker);
        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function() {
          infowindow.marker = null;
          currentPlace = null;
          currentPhoto = 0;
        });
      }
    }
  );
}

// Get next photo
function nextPhoto() {
  if (currentPlace) {
    var totalPhotos = currentPlace.photos.length;
    var next = currentPhoto + 1;
    if (next >= totalPhotos) next = 0;
    
    $('#' + currentPlace.id + '_photo').attr(
      'src',
      currentPlace.photos[next].getUrl({maxHeight: 100, maxWidth: 200})
    );
        
    currentPhoto = next;
  }
}

// Get previous photo
function previousPhoto() {
  if (currentPlace) {
    var totalPhotos = currentPlace.photos.length;
    var next = currentPhoto - 1;
    if (next < 0) next = totalPhotos - 1;
    
    $('#' + currentPlace.id + '_photo').attr(
      'src',
      currentPlace.photos[next].getUrl({maxHeight: 100, maxWidth: 200})
    );
        
    currentPhoto = next;
  }
}

// Hide all of the transport layers, and reset their toggle buttons
function hideLayers() {
  trafficLayer.setMap(null);
  transitLayer.setMap(null);
  bikeLayer.setMap(null);

  $('#toggle-traffic').removeClass('selected');
  $('#toggle-transit').removeClass('selected');
  $('#toggle-bicycling').removeClass('selected');
}

// Toggle the traffic button and layer
function toggleTraffic() {
  if (trafficLayer.getMap() === null) {
    hideLayers();
    trafficLayer.setMap(map);
    $('#toggle-traffic').addClass('selected');
  } else {
    trafficLayer.setMap(null);
    $('#toggle-traffic').removeClass('selected');
  }
}

// Toggle the transit button and layer
function toggleTransit() {
  if (transitLayer.getMap() === null) {
    hideLayers();
    transitLayer.setMap(map);
    $('#toggle-transit').addClass('selected');
  } else {
    transitLayer.setMap(null);
    $('#toggle-transit').removeClass('selected');
  }
}

// Toggle the bicycling button and layer
function toggleBicycling() {
  if (bikeLayer.getMap() === null) {
    hideLayers();
    bikeLayer.setMap(map);
    $('#toggle-bicycling').addClass('selected');
  } else {
    bikeLayer.setMap(null);
    $('#toggle-bicycling').removeClass('selected');
  }
}