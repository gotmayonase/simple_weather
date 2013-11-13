jQuery.fn.random = function() {
    var randomIndex = Math.floor(Math.random() * this.length);  
    return jQuery(this.eq(randomIndex));
};



(function(){
  var index, scroll, times, count, delta, middle, increment, units, bgTimer, precipIntensity = 0;
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
			if ($li.is('.dayBreak,.sunset,.sunrise')) {
				$li = times.eq(index + 1);
			};
      selectTime(index, $li, 0);
    }
  }
  
  function selectTime(index, $li, animationSpeed) {
    times.removeClass('active');
    $li.addClass('active');
		setWeather($li.data('weather'));
		scroll.animate({
      left: (index == count ? index : ($li.position().left * -1)) + middle - 25
    }, animationSpeed)
  }

  $(document).on('mousewheel wheel', function(e){
    var delta = e.originalEvent.deltaY? e.originalEvent.deltaY*(-120) : e.originalEvent.wheelDelta
    scrollTimes(delta);
    if (e.preventDefault)
      stopEvent(e);
    else
      return false;
  })

	$(document).delegate('.times li', 'click', function(){
		$li = $(this);
		if ($li.is('.dayBreak')) {
			return false;
		};
		index = times.index($li);
    selectTime(index, $li, 400);
	})

	function changeBackground() {
		var icon = $('body').data('icon');
		if($('body').attr('class') != icon) {
		  var bodyClass = icon + ' ' + $('body').data('timeClass');
			$('body').attr('class', bodyClass);
			$('.inserted').remove();
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
	      log('getLocation failed: ' + error.code + ' - ' + error.message);
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
	  fetchForecast(latitude, longitude);
	}
	
	function timeClass(time, sunrise, sunset) {
	  var _class = time >= sunrise && time <= sunset ? 'day' : 'night';
	  return _class;
	}
	
	function convertMilitaryHoursToSaneHourString(hours) {
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
    return hours + amPM;
	}
	
	function fetchForecast(latitude, longitude) {
	  $.getJSON('/forecast/' + latitude + ',' + longitude, function(data) {
	    
			var timeZone = data.timezone;
	    units = data.flags.units == 'us' ? 'F' : 'C';
	    var dayIndexStart = new timezoneJS.Date(data.currently.time * 1000, timeZone).getDay();
			var dayIndex;
			$.each(data.daily.data, function(index, dailyData) {
				date = new timezoneJS.Date(dailyData.sunriseTime * 1000, timeZone);
				if (date.getDay() == dayIndexStart) {
					dayIndex = index;
					return false;
				};
			});
	    var currentSunrise = data.daily.data[dayIndex].sunriseTime, currentSunset = data.daily.data[dayIndex].sunsetTime;
			setWeather({
			  temp: data.currently.temperature, 
			  summary: data.currently.summary, 
			  icon: data.currently.icon, 
			  timeClass: timeClass(data.currently.time, currentSunrise, currentSunset), 
			  precipIntensity: data.currently.precipIntensity,
			  cloudCover: data.currently.cloudCover,
			  windSpeed: data.currently.windSpeed
			});
			$('.times').html('');
			var new_items = [], day, prevTimeClass;
	    $.each(data.hourly.data, function(index, tempObject) {
	      var date = new timezoneJS.Date(tempObject.time * 1000, timeZone);
				var newDay = mapToDay(date);
	      var hoursString = convertMilitaryHoursToSaneHourString(date.getHours());
				var $li;
				if (day && day != newDay) {
					new_items.push('<li class="dayBreak">' + newDay + '</li>')
					dayIndex += 1;
					currentSunrise = data.daily.data[dayIndex].sunriseTime;
					currentSunset = data.daily.data[dayIndex].sunsetTime;
				};
				
				$li = $('<li>' + hoursString +'</li>');
				var icon = tempObject.icon;
				if (tempObject.windSpeed > 13 && icon != 'wind')
					icon += ' wind'
				var time = tempObject.time;
        $li.data('weather', {
				  temp: tempObject.temperature,
				  precipIntensity: tempObject.precipIntensity,
				  summary: tempObject.summary,
				  cloudCover: tempObject.cloudCover,
				  icon: icon,
				  timeClass: timeClass(time, currentSunrise, currentSunset),
				  windSpeed: tempObject.windSpeed
				});
        index == 0 &&	$li.addClass('active');
				new_items.push($li);
				if(time <= currentSunrise && time+3600 >= currentSunrise) {
          new_items.push('<li class="sunrise"><span>9</span></li>')
    	  } else if(time <= currentSunset && time+3600 >= currentSunset) {
    	    new_items.push('<li class="sunset"><span>0</span></li>')
    	  }
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
	
	function setWeather(weather) {
		$('.temperature').html([parseInt(weather.temp, 10),'&deg;',units].join(''))
    $('.condition').html(weather.summary)
    var icon = weather.icon.replace(/-(day|night)/, '');
		$('body').data('icon', icon);
    $('body').data('timeClass', weather.timeClass);
    $('body').data('cloudCover', weather.cloudCover);
    $('body').data('windSpeed', weather.windSpeed);
		precipIntensity = units == 'us' ? weather.precipIntensity : weather.precipIntensity / 25.4;
		changeBackground();
		$('body').trigger('weatherChange');
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
	
	function stopEvent(event) {
    event.preventDefault();
    event.stopPropagation();
	}
	
	function randomlyInsertSpan(className, max, extra_css) {
	  max = Math.min(max, 100);
		if (!($('.' + className).length > max)) {
			var $span = $('<span class="' + className + ' inserted"></span>');
			var delay = randomBetween(0.0,5.0) + 's';
			$span.css({left: randomBetween(20,70) + '%', '-webkit-animation-delay': delay, 'animation-delay': delay, '-moz-animation-delay': delay})
			if (arguments.length == 3) {
				$span.css(extra_css);
			};
			if (Math.round(Math.random()) == 0) {
			  $span.addClass('x2');
			};
			$('.cloud').random().prepend($span);
		};
	}
	
	function randomBetween(low, high) {
	  return Math.random()*(high-low)+(low);
	}
	
	$(function(){
		timezoneJS.timezone.zoneFileBasePath = '/tz';
		timezoneJS.timezone.init();
	  getLocation();
	
	  $('form').submit(function(e) {
			geocoder = new google.maps.Geocoder();
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
			stopEvent(e);
	    return false;
	  });
	
		$('#pinButton').click(function(e){
			$('body').toggleClass('open');
			stopEvent(e);
		})
	
		$('#currentLocation').click(function(){
			$('body').removeClass('open');
			$('#loading').show();
			$('#searchField').val('');
			getLocation();
			stopEvent(e);
		})
		
		$('body').on('weatherChange', function(){
		  var cloudCover = $(this).data('cloudCover');
		  if (cloudCover > 0) {
		    $(this).addClass('cloudy');
		    var _scale = cloudCover * 2;
		    $('.cloud').css({
		      '-webkit-transform': 'scale(' + _scale + ')',
		      'transform': 'scale(' + _scale + ')',
		      '-moz-transform': 'scale(' + _scale + ')'
		    })
		  } else {
		    $(this).removeClass('cloudy');
		  }
		  var windSpeed = $(this).data('windSpeed');
      var duration = 40-windSpeed;
      duration = Math.max(Math.min(30, duration),10);
      console.log(windSpeed);
      $('.cloud').each(function(){
        _duration = duration + Math.round(randomBetween(-5,5));
        $(this).css({
          '-webkit-animation-duration': _duration + 's',
          '-moz-animation-duration': _duration + 's',
        });
      });
		});
		
		$('body').delegate('.flake', 'animationiteration webkitAnimationIteration mozAnimationIteration', function(e){
			$(this).css({left: Math.floor(Math.random() * 100) + '%'})
			var dimension = Math.max(6, Math.round(Math.random() * 15));
			randomlyInsertSpan('flake', Math.max(100,precipIntensity * 1000), { 
				width: dimension, 
				height: dimension, 
				opacity: Math.min(0.7, Math.random())
			});
		})
		
		$('body').delegate('.drop', 'animationiteration webkitAnimationIteration mozAnimationIteration', function(e) {
		  $(this).css({left: randomBetween(20,70) + '%'})
			randomlyInsertSpan('drop', Math.max(18, precipIntensity * 1000));
		})
		
	});

	$(window).on('resize', refreshDefaults)
})();