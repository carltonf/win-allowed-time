var assert = require('assert');
var TileModal = require('../src/TileModal');

var tile = null;

beforeEach(function(){
  tile = new TileModal(0, 0, 'Sun', 0);
});

describe('stateTransfer:', function(){
  describe('init correctly:', function(){
    it('init state is "unselected"', function(){
      assert.strictEqual(tile.state, 'unselected');
    });
  })

  describe('valid state transfer:', function(){
    it('unselected with grouping', function(){
      tile.state = 'unselected';
      tile.stateTransfer('grouping');

      assert.strictEqual(tile.state, 'selecting');
    });

    it('selecting with grouping', function(){
      tile.state = 'selecting';
      tile.stateTransfer('grouping');

      assert.strictEqual(tile.state, 'unselected');
    });

    it('selecting with grouping-end', function(){
      tile.state = 'selecting';

      tile.stateTransfer('grouping-end');

      assert.strictEqual(tile.state, 'selected');
    });
  });

  describe('invalid input:', function(){
    it('"invalidInput" is invalid', function(){
      assert.throws(() => tile.stateTransfer('invalidInput'),
                    /input.*invalid/i);
    });
  });

  describe('invalid state transfer:', function(){
    it('unselected with grouping-end is invalid', function(){
      tile.state = 'unselected';

      assert.throws(() => tile.stateTransfer('grouping-end'),
                    /state.*with.*invalid/i);
    });

    it('selected with grouping-end is invalid', function(){
      tile.state = 'selected';

      assert.throws(() => tile.stateTransfer('grouping-end'),
                    /state.*with.*invalid/i);
    });

  });
});

describe('(from/to)JSON: ', function(){
  it('toJSON works for selected', function(){
    tile.state = 'selected';
    var data = tile.toJSON();
    assert.strictEqual(data.state, 'selected');

  });

  it('toJSON works for unselected', function(){
    tile.state = 'unselected';
    var data = tile.toJSON();
    assert.strictEqual(data.state, 'unselected');
  });

  it('fromJSON works', function(){
    tile.state = 'unselected';

    var data = {state: 'selected', other: 'some'};
    tile.fromJSON(data);

    assert.strictEqual(tile.state, 'selected');
  });

  it('fromJSON throws on invalid', function(){
    var invalidData = {invalid:"invalid"};

    assert.throws(() => tile.fromJSON(invalidData),
                  /invalid.*serialization/i);
  })
});

afterEach(function(){
  tile = null;
});
