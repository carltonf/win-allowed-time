var $ = require('jquery');
var WeekHourGrid = require('./WeekHourGrid');

// * Canvas Grid
var config = {
  canvas: {
    mt: 35,
    ml: 65,
  },
  tile: {
    w: 25,
    h: 25,
    mr: 1,
    mb: 1,
  },

  legend: {
    w: 16,
    h: 16,
    mt: 36,
  },
};

var svgConfig = {
  w: 715,
  h: 300,
};

// * Create WeekHourGrid
$(function(){
  $('svg').attr('width', svgConfig.w).attr('height', svgConfig.h);

  var timeGrid = WeekHourGrid.create('#draw > svg', config);
  console.log("Windows 7/8 Allowed Time Table loaded!");
});
