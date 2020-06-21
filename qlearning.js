class Player {
  constructor(options) {
    const defaults = {
      epsilon: null,
      alpha: null,
      minExplore: null,
      pl: 0,
      plHist: [0]
    };
    let opts = Object.assign({}, defaults, options);
    Object.keys(defaults).forEach(prop => {
      this[prop] = opts[prop];
    });
    this.avd = {};
    this.consolidatedAvd = {};

    // Populate initial Action Value Dictionary object:
    for (var i = 0; i < 52; i++) {
      this.assign(this.avd, [i.toString(), "pass"], [0]);
      this.assign(this.avd, [i.toString(), "bet"], [0]);
    }
  }

  // Helper methods for creating nested objects
  assign(obj, keyPath, value) {
    let lastKeyIndex = keyPath.length - 1;
    for (let i = 0; i < lastKeyIndex; i++) {
      let key = keyPath[i];
      if (!(key in obj)) {
        obj[key] = {};
      }
      obj = obj[key];
    }
    obj[keyPath[lastKeyIndex]] = value;
  }

  average = array => array.reduce((a, b) => a + b) / array.length;

  // Learning methods
  newEpsilon(currentEpsilon) {
    var alpha = 1.0 - this.alpha;
    var newEp = alpha * currentEpsilon;
    return newEp;
  }

  maxSearcher(cardRank) {
    var cr = cardRank.toString();
    let maxMove = null;
    let maxUtility = -Infinity;
    for (var [k, v] of Object.entries(this.avd[cr])) {
      let averageUtility = this.average(v);
      if (averageUtility > maxUtility) {
        maxMove = k;
        maxUtility = averageUtility;
      } else if (averageUtility == maxUtility) {
        return "unbiased";
      }
    }
    return maxMove;
  }

  // cardRank is type int
  move(cardRank, nthTrial) {
    if (nthTrial <= this.minExplore) {
      return Math.random() > 0.5 ? true : false;
    } else if (Math.random() <= this.epsilon) {
      this.epsilon = this.newEpsilon(this.epsilon);
      return Math.random() > 0.5 ? true : false;
      // newEp
    } else {
      const maxMove = this.maxSearcher(cardRank);
      return maxMove == "bet" ? true : false;
    }
  }
}

class Dealer {
  constructor(options) {
    const defaults = {
      R: null
    };
    let opts = Object.assign({}, defaults, options);
    Object.keys(defaults).forEach(prop => {
      this[prop] = opts[prop];
    });
  }

  dealCard(dead = -1) {
    var min = Math.ceil(0);
    var max = Math.floor(52);
    var dealt = 0;
    do {
      dealt = Math.floor(Math.random() * (max - min)) + min;
    } while (dealt == dead);
    return dealt; //The maximum is exclusive and the minimum is inclusive
  }

  playerWins(playerCard, dealerCard) {
    if (playerCard > dealerCard) {
      return true;
    }
    return false;
  }

  payout(playerCard, dealerCard) {
    if (this.playerWins(playerCard, dealerCard)) {
      return this.R.w;
    } else {
      return this.R.l;
    }
  }
}

// Game takes a player and a dealer instance
class Game {
  constructor(options) {
    const defaults = {
      R: { w: 10, l: -13, f: -3 },
      nTrials: 10,
      minExplore: 1,
      epsilon: 0.5,
      alpha: 0.001
    };
    let opts = Object.assign({}, defaults, options);
    Object.keys(defaults).forEach(prop => {
      this[prop] = opts[prop];
    });
    this.dealer = new Dealer({
      R: this.R
    });
    this.player = new Player({
      minExplore: this.minExplore,
      passReward: this.dealer.R.f,
      epsilon: this.epsilon,
      alpha: this.alpha
    });
  }

  range = n => [...Array(n).keys()];

  run(callback) {
    for (var t = 1; t <= this.nTrials; t++) {
      var reward;
      var playerCard = this.dealer.dealCard();
      var dealerCard = this.dealer.dealCard(playerCard);
      if (this.player.move(playerCard, t)) {
        reward = this.dealer.payout(playerCard, dealerCard);
        this.player.avd[playerCard.toString()]["bet"].push(reward);
      } else {
        reward = this.dealer.R.f;
        this.player.avd[playerCard.toString()]["pass"].push(reward);
      }
      this.player.pl += reward;
      this.player.plHist.push(this.player.plHist.slice(-1)[0] + reward);
    }

    // Finished
    Object.entries(this.player.avd).forEach(item => {
      this.player.assign(
        this.player.consolidatedAvd,
        [item[0], "bet"],
        Math.round((this.player.average(item[1].bet) + Number.EPSILON) * 100) /
          100
      );
    });
    var res = {
      message: "success",
      consolidatedAvd: this.player.consolidatedAvd,
      playerPL: this.player.pl,
      playerPLHist: this.player.plHist,
      labels: this.range(this.player.plHist.length)
    };
    callback(res);
  }
}

module.exports = {
  Player,
  Dealer,
  Game
};
