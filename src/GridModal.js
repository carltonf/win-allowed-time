// TODO support loading data from storage
// * Constants
// FIX this a constant duplicated in multiple places.
var WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

var TileModal = require('./TileModal');

// * Modal for the whole grid (row-based)
function GridModal (){
  var self = this;

  // ** grid holding a two-dimensional array (row-oriented) of TileModal
  this.grid = dataGen();

  function dataGen(){
    var tileGroup = [];
    // 7x24
    for(var i = 0; i < 7; i++){
      var weekTileGroup = [];
      for(var j = 0; j < 24; j++){
        weekTileGroup.push(new TileModal(i, j, WEEKDAYS[i], j));
      }
      tileGroup.push(weekTileGroup);
    }

    return tileGroup;
  };


  // ** state of the whole grid
  // - "normal": default, nothing special
  // - "grouping": the user is in the middle of grouping tiles
  this.state = "normal";

  // ** state data
  // The correspond data associated with state
  // - "normal": no data associated.
  // - "grouping": an object of GroupingState
  this.stateData = null;

  // ** get tile group
  // Arguments:
  // - startTile(srow, scol) is the top-left tile
  // - endTile(erow, ecol) is the bottom-right tile
  // Return:
  // - a flat ordered one-dimension array containing tiles
  function getTileGroup(startTile, endTile){
    function extent(m, n){
      return (m < n)?[m, n]:[n, m];
    }
    var srow = extent(startTile.row, endTile.row)[0],
        erow = extent(startTile.row, endTile.row)[1],
        scol = extent(startTile.col, endTile.col)[0],
        ecol = extent(startTile.col, endTile.col)[1];

    return self.grid.slice(srow, erow + 1).reduce(function(group, row){
      return group.concat( row.slice(scol, ecol + 1) );
    }, []);
  }
  this.getTileGroup = getTileGroup;

  // ** (to/from)JSON
  // encompass the info about this grid into a JSON object appropriate for
  // stringifying
  this.toJSON = toJSON;
  function toJSON(){
    return self.grid.map(function(row){
      return row.map(function(tile){
        return tile.toJSON();
      });
    })
  }

  this.fromJSON = fromJSON;
  function fromJSON(data){
    // "restorep" is needed to avoid infinite recursion, if toJSON is corrupted
    var restorep = (fromJSON.caller === fromJSON),
        backup = null;
    
    if(!restorep)
      backup = self.toJSON();

    try{
      for(var i = 0; i < 7; i++){
        for(var j = 0; j < 24; j++){
          self.grid[i][j].fromJSON(data[i][j]);
        }
      }
    }
    catch(e){
      if(!restorep)
        // if not already in restore, restore to the original state
        self.fromJSON(backup, true);
      // re-throw the exception
      throw e;
    }

    return self;
  }
}

// * Module Export
module.exports = GridModal;

