var test = require('node:test');
var assert = require('node:assert');
var R = require('../rules.js');

var LAKES = R.LEVEL_RULES;
var STEP = 0.01;

// Every obstacle a lake can spawn, at both ends of its position jitter and its size range.
function variants(kind, li) {
  var pl = R.placement(kind, li), out = [];
  [-1, 1].forEach(function (side) {
    [0, 1].forEach(function (u) {
      var sz = R.size(kind, li, u);
      out.push({ at: pl.offset + side * pl.jitter, sz: sz });
    });
  });
  return out;
}

// Does a hop of length L, launched from the landing point, touch an obstacle centred at `at`?
function hitsInAir(kind, L, at, sz) {
  for (var dist = 0; dist <= L; dist += STEP) {
    if (R.collides(kind, sz, at - dist, R.hopY(L, dist))) return true;
  }
  return false;
}
function hits(kind, L, at, sz) {
  if (kind === 'whirl') return R.collides('whirl', sz, at - L, 0);
  return hitsInAir(kind, L, at, sz);
}
// Smallest gap between the stone and the top of a rock or log while over its collision zone.
function clearance(kind, L, at, sz) {
  var zone = sz.half + 0.15, min = Infinity;
  for (var dist = at - zone; dist <= at + zone; dist += STEP) {
    min = Math.min(min, R.hopY(L, dist) - sz.h);
  }
  return min;
}

var GOOD = R.hopLength(R.Q.good, 0);
var WEAK = R.hopLength(R.Q.weak, 0);
function perfects() {
  var out = [];
  for (var c = 0; c <= 5; c++) out.push(R.hopLength(R.Q.perfect, c));
  return out;
}

LAKES.forEach(function (lv, li) {
  lv.types.forEach(function (kind) {
    var name = 'Lake ' + (li + 1) + ' ' + kind;
    var avoid = kind !== 'bridge';

    test(name + ': Good hops ' + (avoid ? 'clear it' : 'pass under'), function () {
      variants(kind, li).forEach(function (v) {
        assert.strictEqual(hits(kind, GOOD, v.at, v.sz), false, 'at ' + v.at);
        if (kind === 'rock' || kind === 'log') assert.ok(clearance(kind, GOOD, v.at, v.sz) >= 0.08, 'clearance at ' + v.at);
        if (kind === 'whirl') assert.ok(v.at + v.sz.half <= GOOD - 0.4, 'whirlpool edge at ' + v.at);
      });
    });

    test(name + ': Perfect hops at combo 0-5 ' + (avoid ? 'clear it' : 'bonk'), function () {
      perfects().forEach(function (L) {
        variants(kind, li).forEach(function (v) {
          assert.strictEqual(hits(kind, L, v.at, v.sz), !avoid, 'L ' + L + ' at ' + v.at);
        });
      });
    });

    test(name + ': weak hops ' + (avoid ? 'fail' : 'pass under'), function () {
      variants(kind, li).forEach(function (v) {
        assert.strictEqual(hits(kind, WEAK, v.at, v.sz), avoid, 'at ' + v.at);
        if (kind === 'rock') {
          var off = { r: v.sz.r, half: v.sz.half, h: v.sz.h, x: R.ROCK_X };
          assert.strictEqual(hits(kind, WEAK, v.at, off), true, 'off-centre rock at ' + v.at);
        }
      });
    });
  });
});

test('timing grades are symmetric around the landing', function () {
  LAKES.forEach(function (lv) {
    assert.strictEqual(R.grade(lv.win, lv.win), 'perfect');
    assert.strictEqual(R.grade(-lv.win, lv.win), 'perfect');
    assert.strictEqual(R.grade(lv.win * R.GOOD_MULT, lv.win), 'good');
    assert.strictEqual(R.grade(-lv.win * R.GOOD_MULT, lv.win), 'good');
    assert.strictEqual(R.grade(lv.win * R.GOOD_MULT + 0.01, lv.win), 'weak');
  });
});

test('the skim lasts at least as long as the late Good window', function () {
  LAKES.forEach(function (lv) {
    assert.ok(R.SKIM >= lv.win * R.GOOD_MULT, 'win ' + lv.win);
  });
});

test('difficulty rises from lake to lake', function () {
  for (var i = 1; i < LAKES.length; i++) {
    var a = LAKES[i - 1], b = LAKES[i];
    assert.ok(b.goal >= a.goal, 'goal ' + i);
    assert.ok(b.v0 >= a.v0, 'v0 ' + i);
    assert.ok(b.rock >= a.rock, 'rock ' + i);
    assert.ok(b.v0 + b.ramp >= a.v0 + a.ramp, 'top speed ' + i);
    assert.ok(b.win < a.win, 'win ' + i);
  }
  LAKES.forEach(function (lv) { assert.ok(lv.win >= 0.065); });
});

test('every lake from 2 to 5 adds a new challenge', function () {
  for (var i = 1; i < LAKES.length; i++) {
    var a = LAKES[i - 1], b = LAKES[i];
    var newType = b.types.some(function (t) { return a.types.indexOf(t) < 0; });
    var firstPairs = a.cluster === 0 && b.cluster > 0;
    var morePairs = b.cluster > a.cluster && b.types.length === a.types.length;
    assert.ok(newType || firstPairs || morePairs, 'lake ' + (i + 1));
  }
});
