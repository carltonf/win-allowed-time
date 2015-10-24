var GridModal = require('../src/GridModal');
var TileModal = require('../src/TileModal');
var assert = require('assert');

var gridData = null;
beforeEach(function(){
  gridData = new GridModal();
});

describe('init correctly', function(){
});

describe('getTileGroup: ', function(){
  function verifier(st, et){
    // verifying by count the length and the mid tile
    var count = (Math.abs(et.row - st.row) + 1) * (Math.abs(et.col - st.col) + 1);

    var randMidT = { row: Math.floor( (et.row + st.row)/2 ),
                     col: Math.floor( (et.col + st.col)/2 ), };

    var group = gridData.getTileGroup(st, et);

    assert.strictEqual(group.length, count);
    assert.ok(group.find((tile) => {
      return (tile.row === randMidT.row)
        && (tile.col === randMidT.col);
    }));
  }

  var st, et;
  describe('normal input: ', function(){
    it('top-left to bottom-right', function(){
      st = {row: 1, col: 2};
      et = {row: 3, col: 5};

      verifier(st, et);
    });
    it('bottom-right to top-left', function(){
      st = {row: 3, col: 5};
      et = {row: 1, col: 2};

      verifier(st, et);
    });
    it('bottom-left to top-right', function(){
      st = {row: 5, col: 11};
      et = {row: 1, col: 20};

      verifier(st, et);
    });
    it('top-right to bottom-left', function(){
      st = {row: 1, col: 20};
      et = {row: 5, col: 11};

      verifier(st, et);
    });
  });

  describe('edge input: ', function(){
    it('group one tile only', function(){
      et = st = {row: 0, col: 0};

      var firstTile = gridData.grid[0][0],
          group = gridData.getTileGroup(st, et);

      assert.strictEqual(firstTile.row, group[0].row);
      assert.strictEqual(firstTile.col, group[0].col);
    })

    it('group all tiles', function(){
      st = {row: 0, col: 0};
      et = {row: 6, col: 23};

      var group = gridData.getTileGroup(st, et);
      for(var i = 0; i < 7; i++){
        for(var j = 0; j < 24; j++){
          assert.strictEqual(gridData.grid[i][j].row,
                             group[i*24 + j].row);
          assert.strictEqual(gridData.grid[i][j].col,
                             group[i*24 + j].col);
        }
      }
    })
  })

  describe('invalid input: ', function(){
    // TODO on invalid. any?
  });
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

describe('stateTransfer: ', function(){
  describe('verify state transferred correctly', function(){
    var tile = new TileModal(0,0,'Sun',0);
    it('init to normal', function(){
      assert.strictEqual(gridData.state, "normal");
    })

    it('grouping-start: normal -> grouping', function(){
      gridData.stateTransfer('grouping-start', tile);

      assert.strictEqual(gridData.state, 'grouping');
    });

    it('grouping-move: grouping -> grouping', function(){
      gridData.stateTransfer('grouping-start', tile);
      gridData.stateTransfer('grouping-move', tile);
      assert.strictEqual(gridData.state, 'grouping');
    });

    it('grouping -> normal', function(){
      gridData.stateTransfer('grouping-start', tile);
      gridData.stateTransfer('grouping-move', tile);
      gridData.stateTransfer('grouping-end');

      assert.strictEqual(gridData.state, 'normal');
    });
  })
});

describe('serialize: ', function(){
  describe('normal cases: ', function(){
    it('sample 1', function(){
      var sample = require('./fixtures/serialize-sample1.js'),
          json = sample.json,
          expectation = sample.serialization;

      gridData.fromJSON(json);

      assert.strictEqual(gridData.serialize(), expectation);
    });
    it('sample 2', function(){
      var sample = require('./fixtures/serialize-sample2.js'),
          json = sample.json,
          expectation = sample.serialization;

      gridData.fromJSON(json);

      assert.strictEqual(gridData.serialize(), expectation);
    });
  });

  describe('edge cases: ', function(){
    it('select (0,0)', function(){
      gridData.grid[0][0].state = 'selected';

      assert.strictEqual(gridData.serialize(), 'M,0:00-1:00');
    });
    it('select (0,23)', function(){
      gridData.grid[0][23].state = 'selected';

      assert.strictEqual(gridData.serialize(), 'M,23:00-24:00');
    });

    it('select all time on monday', function(){
      gridData.grid[0].forEach(tile => tile.state = 'selected');

      assert.strictEqual(gridData.serialize(), 'M,0:00-24:00');
    });
  });
});
