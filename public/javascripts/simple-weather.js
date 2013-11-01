(function(){
  var index, scroll, times, count, delta, middle, increment, units, bgTimer;
	refreshDefaults();

  function precision( number , precision ){
    var prec = Math.pow( 10 , precision );
    return Math.round( number * prec ) / prec;
  }

  $(document).on('mousewheel', function(e){
		clearTimeout(bgTimer);
		bgTimer = setTimeout(changeBackground, 500);
    index += ((e.originalEvent.wheelDelta > 0 ? 1 : -1) * increment);

    index = precision(index,2)

    if (index <= 0) {
      index = 0
    }
    else if (index >= count) {
      index = count - 1
    }

    if (index % 1 == 0) {
      var $li = times.eq(index);
			if ($li.is('.dayBreak')) {
				$li = times.eq(index + 1);
			};
      times.removeClass('active')
      $li.addClass('active')
			setWeather($li.data('temp'), $li.data('summary'), $li.data('icon'))
      scroll.css({
        left: (index == count ? index : ($li.position().left * -1)) + middle - 25
      })            
    }

    e.preventDefault();
    return false;
  })

	function changeBackground() {
		console.log('changingBackground');
		$('body').attr('class', $('body').data('icon'));
	}

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
	
	function mapToDay(date) {
		return [
			'SUN', 
			'MON', 
			'TUE', 
			'WED', 
			'THU', 
			'FRI', 
			'SAT'
		][date.getDay()];
	}

	function gotLocation(latitude, longitude) {
		$('#loading').show();
	  $.getJSON('/forecast/' + latitude + ',' + longitude, function(data) {
	    units = data.flags.units == 'us' ? 'F' : 'C';
			setWeather(data.currently.temperature, data.currently.summary, data.currently.icon);
			$('.times').html('');
			var new_items = [];
			var day;
	    $.each(data.hourly.data, function(index, tempObject) {
	      var date = new Date(tempObject.time * 1000);
				var newDay = mapToDay(date);
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
				var $li;
				if (day && day != newDay) {
					new_items.push('<li class="dayBreak">' + newDay + '</li>')
				};
				if (index == 0) {
					$li = $('<li class="active">' + hours + ':00' + amPM +'</li>');
				} else {
					$li = $('<li>' + hours + ':00' + amPM +'</li>');
				};
				
				$li.data('temp', tempObject.temperature);
				$li.data('precip', tempObject.precipProbability);
				$li.data('summary', tempObject.summary);
				console.log(tempObject.icon);
				$li.data('icon', tempObject.icon);
				new_items.push($li);
				day = newDay;
	    });
			$('.times').append(new_items);
			refreshDefaults();
			$('#loading').hide();
	  })
	}
	
	function refreshDefaults() {
		index     = 0;
	  scroll    = $('.time-scroll');
	  times     = scroll.find('li');
	  count     = times.length;
	  delta     = 0;
	  middle    = $(window).width()/2;
	  increment = .25;
		scroll.css({left:middle})
	}
	
	function setWeather(temp, condition, icon) {
		$('.temperature').html([parseInt(temp, 10),'&deg;',units].join(''))
    $('.condition').html(condition)
		$('body').data('icon', icon);
	}

	function geocodePosition(position) {
	  geocoder = new google.maps.Geocoder();
	  var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
	  geocoder.geocode({'latLng': latlng}, function(results, status) {
	    if (status == google.maps.GeocoderStatus.OK) {

				var itemStreet, itemCity, itemState, itemCountry, itemZip, itemSnumber;

				// iterate through address_component array
				$.each(results, function(i, result) {
					$.each(result.address_components, function (i, address_component) {
				    if (address_component.types[0] == "route"){
			        itemRoute = address_component.long_name;
				    }

				    if (address_component.types[0] == "locality"){
			        itemCity = address_component.long_name;
				    }

						if (address_component.types[0] == "administrative_area_level_1") {
							itemState = address_component.short_name;
						}

				    if (address_component.types[0] == "country"){ 
			        itemCountry = address_component.long_name;
				    }

				    if (address_component.types[0] == "postal_code_prefix"){ 
			        itemZip = address_component.long_name;
				    }

				    if (address_component.types[0] == "street_number"){ 
			        itemSnumber = address_component.long_name;
				    }
					});
				})
				if (itemState && itemCity) {
					$('.location').html([itemCity, itemState].join(', '))
				};
				
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
	
		$('#pinButton').click(function(e){
			console.log('here');
			$('body').toggleClass('open');
			e.preventDefault();
		})
	});
	
})();
