var $ = require('jquery');
var WeekHourGrid = require('./WeekHourGrid');
var configs = require('./configs');

// * Global exposure
window.app = {};

$(function(){
  $('svg')
    .attr('width', configs.svgConfig.w)
    .attr('height', configs.svgConfig.h);

  // * Create WeekHourGrid
  var timeGrid = WeekHourGrid.create('#draw > svg', configs.gridConfig);
  app.timeGrid = timeGrid;

  // * Controls
  app.controls = require('./AppControls');

  // * Local Storage
  var storageDevice = sessionStorage;
  app.storageDevice = storageDevice;
  function updateWebStorage(){
    var data = timeGrid.serialize();

    // do not store /time:all users
    if(!data) return;

    var username = $('#username').val() || 'UserName';

    // use the user name as the key
    storageDevice.setItem(username, data);
    // '*last*' holds the last updated user name, which gets loaded when the
    // page is loaded.
    storageDevice.setItem('*last*', username);
  }

  $('textarea#script').change(updateWebStorage);

  function loadUserData(username){
    var userData = storageDevice.getItem(username);

    if(userData){
      timeGrid.deserialize(userData);

      $('input#username').val(username);

      app.controls.updateScript();

      return true;
    }

    return false;
  }

  // load last updated user data
  loadUserData( storageDevice.getItem('*last*') );
  // update #savedUserNames, to have better candidates support
  for(var i = 0; i < storageDevice.length; i++){
    var username = storageDevice.key(i);

    if(!username || username == "*last*")
      continue;

    $('<option>').attr('value', username)
      .appendTo('datalist#savedUserNames');
  }

  $('input#username').change(function(e){
    var name = $(this).val();

    if( ! loadUserData(name) ){
      app.controls.reset();
    }
  });

});
