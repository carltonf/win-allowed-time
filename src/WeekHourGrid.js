'use strict';

var d3 = require('d3');
var $ = require('jquery');

// * Constants
var WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

var dataGen = function(){
  function TimeTile(row, col, weekday, startTime){
    // index
    this.row = row;
    this.col = col;
    // descriptive string
    this.weekdayID = weekday;
    this.startTimeID = startTime;

    this.selected = false;
  };
  
  var tileGroup = [];
  // 7x24
  for(var i = 0; i < 7; i++){
    var weekTileGroup = [];
    for(var j = 0; j < 24; j++){
      weekTileGroup.push(new TimeTile(i, j, WEEKDAYS[i], j));
    }
    tileGroup.push(weekTileGroup);
  }

  return tileGroup;
}

/////////////////////////////////////////////////////////////////
// Interactivity

var GroupingStatus = function(sr, er){
  // startRect and endRect are D3 selections
  this.startRect = sr;
  this.endRect = er;

  // use the selected prop of the start tile to decide whether this grouping is
  // selecting or deselecting
  //
  // TODO a policy configuration: all (de)select or invert for every tile
  // (invert is the current implementation)

  this.$lastGroupedTiles = $();
};
var grouping = null;

function groupingEndSync(){
  if (!grouping) return;

  d3.selectAll('.time-tile-selecting, .time-tile-deselecting')
    .each(function(d){
      d.selected = !d.selected;
    });

  d3.selectAll('.time-tile-selecting')
    .classed({
      'time-tile-selecting': false,
      'time-tile-selected': true,
    });

  d3.selectAll('.time-tile-deselecting')
    .classed({
      'time-tile-deselecting': false,
      'time-tile-selected': false,
    });


  grouping = null;
}

// get jQuery collection of tiles to group with regards to startRect and endRect
function $getTiles2Group(startRect, endRect){
  var rowExtent = d3.extent([startRect.row, endRect.row]),
      colExtent = d3.extent([startRect.col, endRect.col]),
      tiles = $();

  $('.week-tile-group-grid').slice(rowExtent[0], rowExtent[1] + 1)
    .each(function(){
      tiles = tiles.add(
        $(this).children().slice(colExtent[0], colExtent[1] + 1)
      );
    });

  return tiles;
}

// * Exports
module.exports = {
  // svgSelector: a selector as understood by d3, the SVG element for drawing
  // the whole grid.
  create: function(svgSelector, config){
    var svgDraw = d3.select(svgSelector),
        svgCanvas = svgDraw
          .append('g')
          .attr('transform',
                'translate(' + config.canvas.ml + ', ' + config.canvas.mt + ')');

    svgDraw
      .append('g')
      .attr('class', 'week-day-label')
      .attr('transform', 'translate(5, ' + config.canvas.mt + ')')
      .selectAll('text')
      .data(WEEKDAYS)
      .enter()
      .append('text')
      .text(function(d){ return d; })
    // .attr('x', 0)
      .attr('y', function(d, idx){ return (config.tile.h + config.tile.mb) * idx; })
      .attr('dy', '1em');

    
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
      .attr('dy', '-5')
      // .attr('y', 0)
      .attr('x', function(_,i){ return (config.tile.w + config.tile.mr)* i; });


    svgDraw.on('click', function(){ d3.event.preventDefault(); });

    svgCanvas
      .append('g')
      .attr('class', 'tile-group-grid')
      .selectAll('g')
      .data(dataGen())
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
          .classed('time-tile-selected', function(d){ return d.selected; });
      });


    
    // TODO check the event, decide actions, update UI, update model, all happen
    // within event handlers. The concrete actions on model should be decoupled using event.
    d3.selectAll('.tile-group-grid rect')
      .on('click.select', function(d, i){
        d3.select(this).classed('time-tile-selected',
                                d.selected = !d.selected);

        // console.log('click at: ' + d.weekdayID + ': ' + d.startTimeID);
      })
      .on('mousedown.grouping-start', function(d, i){
        if (d3.event.which != 1)
          return;

        grouping = new GroupingStatus(d3.select(this));

        // Prevent the browser treating the svg elements as image (so no image drag)
        d3.event.preventDefault();

        // console.log('mouse down: ' + d.weekdayID + ': ' + d.startTimeID);
      })
      .on('mouseenter.grouping-move', function(d, i){
        if (!grouping) return;

        var curGroupedTiles = $getTiles2Group(grouping.startRect.datum(), d),
            lastGroupedTiles = grouping.$lastGroupedTiles,
            newlySelectedTiles = curGroupedTiles.not(lastGroupedTiles),
            newlyDeselectedTiles = lastGroupedTiles.not(curGroupedTiles);

        // TODO make two-way data binding
        d3.selectAll(newlySelectedTiles.get())
          .classed({
            'time-tile-selected': false,
            'time-tile-selecting': function(d){ return !d.selected; },
            'time-tile-deselecting': function(d){ return d.selected; },
          });

        d3.selectAll(newlyDeselectedTiles.get())
          .classed({
            'time-tile-selecting': false,
            'time-tile-deselecting': false,
            'time-tile-selected': function(d){ return d.selected; }
          });

        // memorize the current grouped tiles.
        grouping.$lastGroupedTiles = curGroupedTiles;
        grouping.endRect = d3.select(this);

        // console.log('mouse enter: ' + d.weekdayID + ': ' + d.startTimeID);
      })
      .on('mouseup.grouping-end', groupingEndSync);

    
    // stop grouping when moving out the SVG area
    // TODO change the cursor shape to make this effect more obvious
    svgDraw.on('mouseleave.grouping-end', groupingEndSync);
  },
};
