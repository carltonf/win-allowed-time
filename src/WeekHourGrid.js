'use strict';

var d3 = require('d3');
var $ = require('jquery');
var EventEmitter = require('events');

// * Constants
var WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// * App
// App is more or less the controller, also an event source serving as a message
// hub.
function App() {}
// ** Event supported
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
// DEBUG:
window.gridData = gridData;

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
    var d3Tile = d3.select(tile),
        data = d3Tile.datum();

    gridData.state = "grouping";
    gridData.stateData = new GroupingState(data);

    data.stateTransfer('grouping');

    updateTileView(tile);
  })
  .on('grouping-move', function(tile){
    var d3Tile = d3.select(tile),
        data = d3Tile.datum();

    var groupState = gridData.stateData,
        startTile = groupState.startTile;

    function difference(arrOne, arrTwo){
      return arrOne.filter(function(elm){ return (arrTwo.indexOf(elm) === -1); })
    }

    // modal
    var curGroupedTiles = gridData.getTileGroup(startTile, data),
        lastGroupedTiles = groupState.lastTileGroup,
        newlySelectedTiles = difference(curGroupedTiles, lastGroupedTiles),
        newlyDeselectedTiles = difference(lastGroupedTiles, curGroupedTiles);

    newlySelectedTiles.forEach(function(data){
      data.stateTransfer('grouping');

      // view
      updateTileView(data.el);
    });

    newlyDeselectedTiles.forEach(function(data){
      data.stateTransfer('grouping');

      // view
      updateTileView(data.el);
    });

    // update groupState.
    groupState.lastTileGroup = curGroupedTiles;
    groupState.endTile = data;
  })
  .on('grouping-end', function(){
    var groupState = gridData.stateData;

    // modal
    groupState.lastTileGroup.forEach(function(data){
      data.stateTransfer('grouping-end');

      // view
      updateTileView(data.el);
    })

    // update gridData state
    gridData.state = "normal";
    gridData.stateData = null;
  });

// * Controllers
var GroupingState = function(st){
  // initializing has grouping always starts with single tile
  this.endTile = this.startTile = st;

  // use the selected prop of the start tile to decide whether this grouping is
  // selecting or deselecting
  //
  // TODO a policy configuration: all (de)select or invert for every tile
  // (invert is the current implementation)
  this.lastTileGroup = [this.startTile];
};

/////////////////////////////////////////////////////////////////
// Interactivity
function groupingEndSync(){
  if (gridData.state != "grouping") return;

  app.emit('grouping-end', this);
}

// * Exports
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
