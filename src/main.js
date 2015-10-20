var $ = require('jquery');
var WeekHourGrid = require('./WeekHourGrid');

// * Canvas Grid
var config = {
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

// * Create WeekHourGrid
$(function(){
  var timeGrid = WeekHourGrid.create('#draw > svg', config);
  console.log("Windows 7/8 Allowed Time Table loaded!");
});

