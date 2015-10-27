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
  require('./AppControls');

  // * Local Storage
});
