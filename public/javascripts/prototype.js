(function(){
var index     = 0
  , scroll    = $('.time-scroll')
  , times     = scroll.find('li')
  , count     = times.length
  , delta     = 0
  , middle    = $('.time-scroll').innerWidth()/2
  , increment = .1

scroll.css({left:middle})

function precision( number , precision ){
  var prec = Math.pow( 10 , precision );
  return Math.round( number * prec ) / prec;
}        

$(document).on('mousewheel', function(e){

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
    times.removeClass('active')
    $li.addClass('active')
    scroll.css({
      left: (index == count ? index : ($li.position().left * -1)) + middle - 25
    })            
  }

  e.preventDefault();
  return false;
})
})();


$(function(){
  $('body').click(function(){
    $(this).toggleClass('open')
  })


})