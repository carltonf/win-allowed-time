'use strict';

var d3 = require('d3'),
    $ = require('jquery'),
    EventEmitter = require('events'),
    WEEKDAYS = require('./commons').WEEKDAYS;

// * TimeGrid
// TimeGrid is more or less the controller, also an event source serving as a message
// hub.
function TimeGrid() {
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

  // ** Reset the whole grid both modal and view
  this.reset = reset;
  function reset(){
    self.gridData.grid.forEach(function(row){
      row.forEach(function(data){
        data.state = 'unselected';
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
TimeGrid.prototype = new EventEmitter();

// ** globally exposed
var timeGrid = new TimeGrid();

// * Modal
var GridModal = require('./GridModal');

timeGrid.gridData = new GridModal();

// ** Data bound with timeGrid
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

timeGrid
  .on('grouping-start', function(tile){
    this.gridData.stateTransfer('grouping-start', d3.select(tile).datum());

    updateTileView(tile);
  })
  .on('grouping-move', function(tile){
    this.gridData.stateTransfer('grouping-move', d3.select(tile).datum());

    this.gridData.lastUpdatedTiles.forEach(function(tileData){
      updateTileView(tileData.el);
    });
  })
  .on('grouping-end', function(){
    this.gridData.stateTransfer('grouping-end');

    this.gridData.lastUpdatedTiles.forEach(function(tileData){
      updateTileView(tileData.el);
    });
  });

function groupingEndSync(){
  if (timeGrid.gridData.state != "grouping") return;

  timeGrid.emit('grouping-end', this);
}


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

    // ** Legends
    var legends = svgDraw
          .append('g')
          .attr('class', 'grid-legends')
          .attr('transform', 'translate('
                + config.canvas.ml + ', '
                + (config.canvas.mt + 7*(config.tile.h + config.tile.mb) + config.legend.mt)
                + ')'),
        singleLegend = legends.append('g');
    singleLegend
      .append('rect')
      .attr('width', config.legend.w)
      .attr('height', config.legend.h)
      .attr('class', 'time-tile time-tile-selected');
    singleLegend.append('text')
      .text('Allowed')
      .attr('x', config.legend.w)
      .attr('dx', '7')
      .attr('y', config.legend.h)
      .attr('dy', '-2');
    // second legend
    singleLegend = legends
      .append('g')
      .attr('transform', 'translate('+ config.legend.w * 6.5 +',0)');
    singleLegend.append('rect')
      .attr('width', config.legend.w)
      .attr('height', config.legend.h)
      .attr('class', 'time-tile')
    singleLegend.append('text')
      .text('Forbidden')
      .attr('x', config.legend.w)
      .attr('dx', '7')
      .attr('y', config.legend.h)
      .attr('dy', '-2');


    // ** Create Grid
    gridCanvas
      .append('g')
      .attr('class', 'tile-group-grid')
      .selectAll('g')
      .data(timeGrid.gridData.grid)
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

        timeGrid.emit('grouping-start', this);
      })
      .on('mouseenter.grouping-move', function(d, i){
        if (timeGrid.gridData.state != "grouping") return;

        timeGrid.emit('grouping-move', this);
      })
      .on('mouseup.grouping-end', groupingEndSync);

    // mouseup outside gridCanvas ends grouping to avoid pointer tangling
    svgDraw.on('mouseup.grouping-end', groupingEndSync);

    // stop grouping when moving out the SVG area
    // TODO change the cursor shape to make this effect more obvious
    svgDraw.on('mouseleave.grouping-end', groupingEndSync);

    // return timeGrid
    return timeGrid;
  },
};
