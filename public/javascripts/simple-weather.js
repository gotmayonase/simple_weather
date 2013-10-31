function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position){
      gotLocation(position.coords.latitude,position.coords.longitude)
      geocodePosition(position);
    }, function(error){
      gotLocation(32,100)
      console.log(error);
    });
  }
  else {
    console.log('not locating')
  }
}

function gotLocation(latitude, longitude) {
  $.getJSON('/forecast/' + latitude + ',' + longitude, function(data) {
    var units = data.flags.units == 'us' ? 'F' : 'C';

    $('.temp').html([parseInt(data.currently.temperature, 10),'&deg;',units].join(''))
    $('.condition').html(data.currently.summary)

    $('#weatherSummary ul').html('');
    $('#weatherSummary ul').append('<li>' + data.currently.summary + '</li>')
    $('#weatherSummary ul').append('<li>' + Math.round(data.currently.temperature) + '&deg;' + units + '</li>')
    $('#weatherSummary ul').append('<li>' + Math.round(data.currently.precipProbability*100) + '% chance of precipitation</li>')
    $('#weatherSummary ul').append('<li>High: ' + Math.round(data.daily.data[0].temperatureMax) + '&deg;' + units + '</li>')
    $('#weatherSummary ul').append('<li>Low: ' + Math.round(data.daily.data[0].temperatureMin) + '&deg;' + units + '</li>')
    $('#hourlyData').html('');
    $.each(data.hourly.data, function(index, tempObject) {
      var date = new Date(tempObject.time * 1000);
      var hours = date.getHours();
      var amPM = 'am';
      if(hours > 12){
        hours = hours - 12;
        amPM = 'pm'
      } else if(hours == 0) {
        hours = 12
      } else if(hours == 12){
        hours = 12
        amPM = 'pm'
      }
      $('#hourlyData').append('<section> \
        <h1>' + hours + ':00' + amPM +'</h1> \
        <ul> \
          <li>' + tempObject.summary + '</li> \
          <li>' + Math.round(tempObject.temperature) + '&deg;' + units + '</li> \
          <li>' + Math.round(tempObject.precipProbability*100) + '% chance of precipitation</li> \
        </ul> \
      </section>')
    })
  })
}

function geocodePosition(position) {
  geocoder = new google.maps.Geocoder();
  var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
  geocoder.geocode({'latLng': latlng}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      if (results[1]) {
        $('.location').html(results[1].formatted_address)
      }
    } else {
      alert("Geocoder failed due to: " + status);
    }
  });
}

$(function(){
  getLocation();
  $('form').submit(function() {
    var address = $('#searchField').val();
    geocoder.geocode( { 'address': address}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        position = results[0].geometry.location;
        gotLocation(position.lb, position.mb);
        $('h2').html(results[0].formatted_address);
      } else {
        console.log("Geocode was not successful for the following reason: " + status);
        console.log(results);
      }
    });
    return false;
  });
  
  $('#currentLocation').click(function(e){
    getLocation();
    $('#searchField').val('');
    e.preventDefault();
  });
});
