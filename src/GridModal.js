// TODO support loading data from storage
// * Constants
// FIX this a constant duplicated in multiple places.
var WEEKDAYS = require('./commons').WEEKDAYS;

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

  // ** (de)serialize
  // a compressed data format for serialization
  //
  // Serialized into an array of integers, each bit of which represents a single
  // tile: 1 for selected, 0 for unselected.
  this.serialize = serialize;
  function serialize(){
    var res = [],
        bitmap = 0;

    for(var i = 0; i < 7; i++){
      bitmap = 0;
      for(var j = 0; j < 24; j++){
        bitmap += (self.grid[i][j].state === 'selected') ? (2 << j) : 0;
      }

      res.push(bitmap);
    }

    // build up a string
    var resStr = "";
    for(var i = 0; i < 7; i++){
      bitmap = res[i].toString(2);
      resStr += '0'.repeat(24 - bitmap.length) + bitmap + ' ';
    }

    return resStr;
  }

  // ** states
  // *** state of the whole grid
  // - "normal": default, nothing special
  // - "grouping": the user is in the middle of grouping tiles
  this.state = "normal";

  // *** state data
  // The correspond data associated with state
  // - "normal": no data associated.
  // - "grouping": an object of GroupingState
  this.stateData = null;

  // *** state transfer
  // transfer this own state and corresponding tiles states
  // args:
  // - input: state events
  // - tile: instanceof TileModal
  this.stateTransfer = stateTransfer;
  function stateTransfer(input, tile){
    switch(input){
    case "grouping-start":
      self.state = "grouping";
      self.stateData = new GroupingState(tile);

      tile.stateTransfer('grouping');

      self.lastUpdatedTiles = [tile];
      break;
    case "grouping-move":
      var curTileGroup = self.getTileGroup(self.stateData.startTile, tile);
      self.lastUpdatedTiles = xor(curTileGroup, self.stateData.lastTileGroup);

      self.lastUpdatedTiles.forEach(function(tile){
        tile.stateTransfer('grouping');
      });

      self.stateData.lastTileGroup = curTileGroup;
      self.stateData.endTile = tile;
      break;
    case "grouping-end":
      self.lastUpdatedTiles = [];

      self.stateData.lastTileGroup.forEach(function(tile){
        tile.stateTransfer('grouping-end');
        self.lastUpdatedTiles.push(tile);
      });

      self.state = "normal";
      self.stateData.stateData = null;
      break;
    default:
    }
  }

  // *** tiles that most recently gets updated
  this.lastUpdatedTiles = null;
}

function GroupingState(st){
  // initializing has grouping always starts with single tile
  this.endTile = this.startTile = st;

  // use the selected prop of the start tile to decide whether this grouping is
  // selecting or deselecting
  //
  // TODO a policy configuration: all (de)select or invert for every tile
  // (invert is the current implementation)
  this.lastTileGroup = [this.startTile];
};

// * helper
// TODO underscore has _.difference
function xor(arrOne, arrTwo){
  return difference(arrOne, arrTwo).concat(
    difference(arrTwo, arrOne)
  );
}
function difference(arrOne, arrTwo){
  return arrOne.filter(function(elm){ return (arrTwo.indexOf(elm) === -1); })
}


// * Module Export
module.exports = GridModal;
