/* Skip Stone gameplay rules: hop geometry, timing grades, obstacle placement and collisions.
   Shared by skipstone.html (window.SkipRules) and the Node tests (module.exports). */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SkipRules = api;
})(this, function () {
  // Each lake adds one new challenge: rocks, logs, whirlpools, low bridges, then frequent pairs.
  var LEVEL_RULES = [
    { goal: 150, v0: 8.0, ramp: 1.2, rock: 0.25, cd: 4, cluster: 0, fly: 0.15, win: 0.10, types: ['rock'],
      rockH: 0.55, rockR: 0.40, logLen: 1.6, whirl: [5.6, 1.1], bridgeH: 1.15, jitter: 0.15 },
    { goal: 250, v0: 9.0, ramp: 1.4, rock: 0.35, cd: 3, cluster: 0, fly: 0.2, win: 0.09, types: ['rock', 'log'],
      rockH: 0.60, rockR: 0.44, logLen: 1.6, whirl: [5.6, 1.1], bridgeH: 1.15, jitter: 0.15 },
    { goal: 350, v0: 10.0, ramp: 1.6, rock: 0.45, cd: 3, cluster: 0, fly: 0.4, win: 0.08, types: ['rock', 'log', 'whirl'],
      rockH: 0.65, rockR: 0.48, logLen: 2.0, whirl: [5.6, 1.1], bridgeH: 1.15, jitter: 0.2 },
    { goal: 450, v0: 11.0, ramp: 1.8, rock: 0.5, cd: 2, cluster: 0.15, fly: 0.3, win: 0.075, types: ['rock', 'log', 'whirl', 'bridge'],
      rockH: 0.70, rockR: 0.52, logLen: 2.3, whirl: [5.5, 1.3], bridgeH: 1.15, jitter: 0.2 },
    { goal: 550, v0: 12.0, ramp: 2.0, rock: 0.55, cd: 2, cluster: 0.45, fly: 0.3, win: 0.07, types: ['rock', 'log', 'whirl', 'bridge'],
      rockH: 0.72, rockR: 0.54, logLen: 2.6, whirl: [5.4, 1.4], bridgeH: 1.15, jitter: 0.2 }
  ];

  // SKIM must outlast the late Good window (win * GOOD_MULT) on every lake.
  var SKIM = 0.21, EARLY = 0.26, GOOD_MULT = 1.9;
  var Q = { perfect: 1, good: 0.6, weak: 0.25 };
  var ROCK_X = 0.15, ROCK_R_VAR = 0.1, LOG_H = 0.5, BRIDGE_HALF = 0.4, BRIDGE_AT = 4.7, SIDE_JITTER = 0.15;

  function hopLength(q, combo) { return 4.4 + 5.0 * q + Math.min(combo, 5) * 0.3; }
  function hopHeight(L) { return 0.3 + (L - 4.4) * 0.2; }
  function hopY(L, dist) {
    var s = dist / L;
    if (s <= 0 || s >= 1) return 0;
    return 4 * hopHeight(L) * s * (1 - s);
  }

  // offSeconds: how far the tap was from the landing, either side.
  function grade(offSeconds, win) {
    var off = Math.abs(offSeconds);
    if (off <= win) return 'perfect';
    if (off <= win * GOOD_MULT) return 'good';
    return 'weak';
  }

  // Offset from the landing point the obstacle is placed relative to, and the +/- jitter around it.
  // Rocks and logs sit under the peak of a Good hop; bridges under the peak of a Perfect hop.
  function placement(kind, levelIdx) {
    var lv = LEVEL_RULES[levelIdx];
    if (kind === 'whirl') return { offset: lv.whirl[0], jitter: SIDE_JITTER };
    if (kind === 'bridge') return { offset: BRIDGE_AT, jitter: SIDE_JITTER };
    return { offset: hopLength(Q.good, 0) / 2, jitter: lv.jitter };
  }

  // u in [0, 1] picks the rock radius within its range.
  function size(kind, levelIdx, u) {
    var lv = LEVEL_RULES[levelIdx];
    if (kind === 'rock') {
      var r = lv.rockR + u * ROCK_R_VAR;
      return { r: r, half: r * 1.15 * 0.9, h: lv.rockH };
    }
    if (kind === 'log') return { half: lv.logLen / 2, h: LOG_H };
    if (kind === 'whirl') return { half: lv.whirl[1], h: 0 };
    return { half: BRIDGE_HALF, h: lv.bridgeH };
  }

  // dz: obstacle centre minus stone position. For whirlpools this is only checked on landing.
  function collides(kind, sz, dz, y) {
    var x = sz.x || 0;
    if (kind === 'rock') return Math.sqrt(x * x + dz * dz) < sz.half + 0.15 && y < sz.h;
    if (kind === 'log') return Math.abs(dz) < sz.half + 0.15 && y < sz.h;
    if (kind === 'bridge') return Math.abs(dz) < sz.half && y + 0.12 > sz.h;
    if (kind === 'whirl') return Math.abs(dz) < sz.half;
    return false;
  }

  return {
    LEVEL_RULES: LEVEL_RULES,
    SKIM: SKIM, EARLY: EARLY, GOOD_MULT: GOOD_MULT, Q: Q, ROCK_X: ROCK_X,
    hopLength: hopLength, hopHeight: hopHeight, hopY: hopY, grade: grade,
    placement: placement, size: size, collides: collides
  };
});
