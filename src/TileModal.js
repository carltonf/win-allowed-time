// * Modal for every tile in the grid
function TileModal(row, col, weekday, startTime){
  var self = this;

  // ** index
  this.row = row;
  this.col = col;

  // ** a string representing the current week day.
  this.weekdayID = weekday;
  // ** a number depicting the beginning hour.
  this.startTimeID = startTime;

  // ** States of this tile
  // - 'unselected': state non-selected, initial state.
  // - 'selecting' : selected while grouping
  // - 'deselecting': deselected while grouping
  // - 'selected'  : selected
  this.state = 'unselected';
  this.stateTransfer = stateTransfer;
  function stateTransfer(input){
    var validInputs = ['grouping', 'grouping-end'];
    if( validInputs.indexOf(input) === -1 ) {
      throw new Error('Input: ' + input + ' is invalid');
      return;
    }

    var stateInputMap = {
      'unselected': {
        'grouping': 'selecting',
      },
      'selecting': {
        'grouping': 'unselected',
        'grouping-end': 'selected',
      },
      'deselecting': {
        'grouping': 'selected',
        'grouping-end': 'unselected',
      },
      'selected': {
        'grouping': 'deselecting',
      }
    };

    var nextState = stateInputMap[self.state][input];
    if (!nextState){
      // TODO throw an error
      throw new Error('State: ' + self.state + ' with ' + input + ' is invalid!');
    }
    else {
      self.state =  nextState;
    }
  }

  // ** DOM element for this modal
  this.el = null;
  // ** (to/from)JSON
  // return a JSON encompassing the data representing current tile's info
  // the JSON object should be appropriate for stringifying
  this.toJSON = toJSON;
  function toJSON(){
    var exportData = {
      state: self.state,
    }
    return exportData;
  }

  this.fromJSON = fromJSON;
  function fromJSON(data){
    if (!data || !data.state){
      throw new Error(JSON.stringify(data) + ' is invalid Tile serialization.');
    }
    else{
      self.state = data.state;
    }
  }
};

// * Module Export
module.exports = TileModal;
