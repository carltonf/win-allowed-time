var GridModal = require('../src/GridModal');
var assert = require('assert');

var gridData = null;
beforeEach(function(){
  gridData = new GridModal();
});

describe('init correctly', function(){
});

describe('getTileGroup: ', function(){
  it('getTileGroup works');
});

describe('to/from JSON: ', function(){
  it('init to be all unselected', function(){
    gridData.toJSON().forEach(function(row){
      row.forEach(function(tile){
        assert.strictEqual(tile.state, 'unselected');
      });
    });
  });

  it('random fixture 1 works', function(){
    var jsonFixture = require('./fixtures/gridData-json-random1.json');

    assert.deepStrictEqual(gridData.fromJSON(jsonFixture).toJSON(), jsonFixture);
  });

  it('invalid fixture would not corrupt grid state', function(){
    var invalidJSON = [[{"state":"selected"},{"state":"selected"}]];

    var oldData = gridData.toJSON();
    assert.throws(() => gridData.fromJSON(invalidJSON));

    assert.deepStrictEqual(gridData.toJSON(), oldData);
  })
});
