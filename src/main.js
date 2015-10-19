var $ = require('jquery');
var TimeGrid = require('./TimeGrid');

$(function(){
  var weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  var config = {
    // ~hour
    timeUnit: 1,

    canvas: {
      mt: 50,
      ml: 50,
    },
    tile: {
      w: 25,
      h: 25,
      mr: 1,
      mb: 1,
    },
  };

  config.colNums = Math.floor(24 / config.timeUnit);

  var timeGridConfigs = {
    hLabels: function(){
      for (var i = 0; i < ){}
    }
  };

  var timeGrid = TimeGrid.create('#draw > svg');
  console.log("Windows 7/8 Allowed Time Table loaded!");
});

