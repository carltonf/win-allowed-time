'use strict';

var d3 = require('d3'),
    $ = require('jquery'),
    EventEmitter = require('events'),
    WEEKDAYS = require('./commons').WEEKDAYS;

// * App
// App is more or less the controller, also an event source serving as a message
// hub.
function App() {
  var self = this;

  // ** refresh the view for the whole grid.
  // TODO have a view object and attach a callback to modal change event
  this.refreshView = refreshView;
  function refreshView(){
    self.gridData.grid.forEach(function(row){
      row.forEach(function(data){
        updateTileView(data.el);
      });
    });
  }

}
// ** Event support
// Each case the current tile DOM element is passed as the argument to the
// callback
// - 'toggle'
// - 'grouping-start':
// - 'grouping-move':
// - 'grouping-end':
App.prototype = new EventEmitter();

// ** globally exposed
var app = new App();

// * Modal
var GridModal = require('./GridModal');

var gridData = new GridModal();
app.gridData = gridData;

// ** Data bound with App
// FIX for now, view updates are conducted here as well, factor them out
function updateTileView(tile){
  var d3Tile = d3.select(tile),
      data = d3Tile.datum();

  d3Tile.classed({
    'time-tile-selecting': data.state === "selecting",
    'time-tile-deselecting': data.state === "deselecting",
    'time-tile-selected': data.state === "selected",
  });
}

app
  .on('grouping-start', function(tile){
    gridData.stateTransfer('grouping-start', d3.select(tile).datum());

    updateTileView(tile);
  })
  .on('grouping-move', function(tile){
    gridData.stateTransfer('grouping-move', d3.select(tile).datum());

    gridData.lastUpdatedTiles.forEach(function(tileData){
      updateTileView(tileData.el);
    });
  })
  .on('grouping-end', function(){
    gridData.stateTransfer('grouping-end');

    gridData.lastUpdatedTiles.forEach(function(tileData){
      updateTileView(tileData.el);
    });
  });

function groupingEndSync(){
  if (gridData.state != "grouping") return;

  app.emit('grouping-end', this);
}

// * Global Exposure
window.app = app


// * Module Exports
module.exports = {
  // svgSelector: a selector as understood by d3, the SVG element for drawing
  // the whole grid.
  create: function(svgSelector, config) {
    var svgDraw = d3.select(svgSelector),
        gridCanvas = svgDraw
          .append('g')
          .attr('transform',
                'translate(' + config.canvas.ml + ', ' + config.canvas.mt + ')');
    // ** Labels
    svgDraw
      .append('g')
      .attr('class', 'week-day-label')
      .attr('transform', 'translate(5, ' + config.canvas.mt + ')')
      .selectAll('text')
      .data(WEEKDAYS)
      .enter()
      .append('text')
      .text(function(d){ return d; })
      .attr('x', config.canvas.ml)
      .attr('dx', '-1em')
      .attr('y', function(d, idx){ return (config.tile.h + config.tile.mb) * idx; })
      .attr('dy', '1em')
      .attr('text-anchor', 'end');

    svgDraw
      .append('g')
      .attr('class', 'time-unit-label')
      .attr('transform', 'translate(' + config.canvas.ml +', ' + config.canvas.mt + ')')
      .selectAll('text')
      .data( Array(24) )
      .enter()
      .append('text')
      .text(function(_,i){ return i;})
      .attr('text-anchor', 'middle')
      .attr('dy', '-7')
      .attr('x', function(_,i){ return (config.tile.w + config.tile.mr)* i; });

    // ** Create Grid
    gridCanvas
      .append('g')
      .attr('class', 'tile-group-grid')
      .selectAll('g')
      .data(gridData.grid)
      .enter()
      .append('g')
      .attr('class', 'week-tile-group-grid')
      .attr('transform', function(_,idx){
        return 'translate(0, ' + (config.tile.h + config.tile.mb) * idx + ')'; })
      .each(function(d,idx){
        // recursively build up every row
        d3.select(this)
          .selectAll('rect')
          .data(d)
          .enter()
          .append('rect')
          .attr('class', 'time-tile')
          .attr('x', function(d){ return (config.tile.w + config.tile.mr ) * d.startTimeID; })
          .attr('width', config.tile.w)
          .attr('height', config.tile.h)
        // establish relationship between modal and view
          .each(function(d){ d.el = this; })
          // .classed('time-tile-selected', function(d){ return d.selected; });
      });

    // ** Interactivity
    svgDraw.on('click', function(){ d3.event.preventDefault(); });

    d3.selectAll('.tile-group-grid rect')
    // simple click/toggle is a special case of grouping, which starts and ends
    // at the same tile
      .on('mousedown.grouping-start', function(){
        var LEFT_MOUSE_BUTTON = 1;
        if (d3.event.which != LEFT_MOUSE_BUTTON)
          return;

        // Prevent the browser treating the svg elements as image (so no image
        // drag)
        d3.event.preventDefault();

        app.emit('grouping-start', this);
      })
      .on('mouseenter.grouping-move', function(d, i){
        if (gridData.state != "grouping") return;

        app.emit('grouping-move', this);
      })
      .on('mouseup.grouping-end', groupingEndSync);

    // mouseup outside gridCanvas ends grouping to avoid pointer tangling
    svgDraw.on('mouseup.grouping-end', groupingEndSync);

    // stop grouping when moving out the SVG area
    // TODO change the cursor shape to make this effect more obvious
    svgDraw.on('mouseleave.grouping-end', groupingEndSync);
  },
};
