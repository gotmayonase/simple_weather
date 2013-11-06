(function(){
  var index, scroll, times, count, delta, middle, increment, units, bgTimer;
	refreshDefaults();
	
	function log(message) {
		$.post('/log', { message: message }, function(data) {
			console.log(data);
		})
	}

  function precision( number , precision ){
    var prec = Math.pow( 10 , precision );
    return Math.round( number * prec ) / prec;
  }
  
  function scrollTimes(delta) {
		clearTimeout(bgTimer);
		bgTimer = setTimeout(changeBackground, 500);
    index += ((delta > 0 ? 1 : -1) * increment);

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
  }

  $(document).on('mousewheel wheel', function(e){
    var delta = e.originalEvent.deltaY? e.originalEvent.deltaY*(-120) : e.originalEvent.wheelDelta
    scrollTimes(delta);
    if (e.preventDefault)
      e.preventDefault();
    else
      return false;
  })

	$(document).delegate('.times li', 'click', function(){
		$li = $(this);
		if ($li.is('.dayBreak')) {
			return false;
		};
		index = times.index($li);
		times.removeClass('active')
    $li.addClass('active')
		setWeather($li.data('temp'), $li.data('summary'), $li.data('icon'))
		changeBackground();
    scroll.css({
      left: (index == count ? index : ($li.position().left * -1)) + middle - 25
    })
	})

	function changeBackground() {
		var icon = $('body').data('icon');
		if($('body').attr('class') != icon) {
			$('body').attr('class', icon);
			$('.weatherBG').removeClass('active')			
			$('.weatherBG.' + icon).addClass('active');
		}
	}

	function getLocation() {
	  if (navigator.geolocation) {
	    navigator.geolocation.getCurrentPosition(function(position){
	      gotLocation(position.coords.latitude,position.coords.longitude)
	      geocodePosition(position);
	    }, function(error){
	      gotLocation(32.7758,-96.7967)
				$('.location').html('Dallas, TX')
	      log('getLocation failed: ' + error);
	    }, {timeout: 10000});
	  }
	  else {
	    log('navigator.geolocation was false');
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
			changeBackground();
			$('.times').html('');
			var new_items = [];
			var day;
	    $.each(data.hourly.data, function(index, tempObject) {
	      var date = new Date(tempObject.time * 1000);
				var newDay = mapToDay(date);
	      var hours = date.getHours();
	      var amPM = 'AM';
	      if(hours > 12){
	        hours = hours - 12;
	        amPM = 'PM'
	      } else if(hours == 0) {
	        hours = 12
	      } else if(hours == 12){
	        hours = 12
	        amPM = 'PM'
	      }
				var $li;
				if (day && day != newDay) {
					new_items.push('<li class="dayBreak">' + newDay + '</li>')
				};
				if (index == 0) {
					$li = $('<li class="active">' + hours + amPM +'</li>');
				} else {
					$li = $('<li>' + hours + amPM +'</li>');
				};
				
				$li.data('temp', tempObject.temperature);
				$li.data('precip', tempObject.precipProbability);
				$li.data('summary', tempObject.summary);
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
				updateLocation(results);
	    } else {
	      alert("Geocoder failed due to: " + status);
	    }
	  });
	}
	
	function updateLocation(geocodeResults){
		var itemStreet, itemCity, itemStateShort, itemStateLong, itemCountry, itemZip, itemSnumber;

		// iterate through address_component array
		$.each(geocodeResults, function(i, result) {
			$.each(result.address_components, function (i, address_component) {
				
		    if (address_component.types[0] == "route"){
	        itemRoute = address_component.long_name;
		    }

		    if (address_component.types[0] == "locality"){
	        itemCity = address_component.long_name;
		    }

				if (address_component.types[0] == "administrative_area_level_1") {
					itemStateShort = address_component.short_name;
					itemStateLong = address_component.long_name;
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
		if (itemStateShort && itemCity) {
			$('.location').html([itemCity, itemStateShort].join(', '))
		} else if(itemStateLong) {
			$('.location').html(itemStateLong);
		} else {
			$('.location').html(geocodeResults[0].formatted_address)
		};
	}
	
	$(function(){
	  getLocation();
	  $('form').submit(function() {
	    var address = $('#searchField').val();
	    geocoder.geocode( { 'address': address}, function(results, status) {
	      if (status == google.maps.GeocoderStatus.OK) {
	        position = results[0].geometry.location;
	        gotLocation(position.lat(), position.lng());
					updateLocation(results);
					$('.error').html('')
	      } else {
					$('.error').html('No results found :(')
	        log("Geocode was not successful for the following reason: " + status);
	        log(results);
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
			$('body').toggleClass('open');
			e.preventDefault();
		})
	
		$('#currentLocation').click(function(){
			$('body').removeClass('open');
			$('#loading').show();
			getLocation();
		})
	});
	

	$(window).on('resize', refreshDefaults)
})();
