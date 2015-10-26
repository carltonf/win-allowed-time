var $ = require('jquery');
var WeekHourGrid = require('./WeekHourGrid');
var configs = require('./configs');

// * Create WeekHourGrid
$(function(){
  $('svg')
    .attr('width', configs.svgConfig.w)
    .attr('height', configs.svgConfig.h);

  var timeGrid = WeekHourGrid.create('#draw > svg', configs.gridConfig);
  console.log("Windows 7/8 Allowed Time Table loaded!");

  // * Controls
  $('#reset-grid').click(function(){
    timeGrid.reset();
  });
});
