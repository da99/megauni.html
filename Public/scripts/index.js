"use strict";
/* jshint undef: true, unused: true */


// if( window.location.href.indexOf('www.') == -1 && window.location.href.indexOf('busynoise') > -1 )
//  window.location= window.location.href.replace('http://', 'http://www.');

$(window).addEvent('load', function(){

  // Create a function to be used to select timezone menu.
  var tz_offset = (((new Date()).getTimezoneOffset())/60)*(-1);
  var tz_offset_str = tz_offset + '';
  var current_country = 'Not USA';
  var selected_opt = null;
  var select_tz= function(ele){

    if(ele.get('disabled'))
      current_country = ele.get('html');

    if(current_country.indexOf('U.S.A.') > -1 && ele.get('html').indexOf( tz_offset_str ) > 1 && ele.get('value').indexOf('America') > -1) {
      selected_opt = ele;
      return true;
    }

    if(ele.get('html').indexOf('niversal') > -1 && !selected_opt)
      return true;

    return false;
  };

  // Set "timezone" menu to the current user's GMT offset..
  $('trial').getBusyForm().set('menu', 'timezone', select_tz);

}); // end $(window).addEvent


