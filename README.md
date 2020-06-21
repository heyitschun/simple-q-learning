# simple-q-learning

## Initialize A Game
```javascript
const Q = require("./qlearning");

// Setting game parameters
var game = new Q.Game({
    nTrials: 1000,
    minExplore: 100,
    epsilon: 0.5,
    alpha: 0.01,
    R: {
        w: 20, 
        l: -20,
        f: -3
    }
})
```

## Train The Bot

When running the bot, we must pass a callback function to handle the results of the game:

```javascript
game.run(result => {
    var finalProfit = result.playerPL;
    var actionValueDict = JSON.stringify(result.consolidatedAvd);

    // some data for plotting the results in graph:
    var yValues = result.playerPLHist;
    var xValues = result.labels;

    console.log(finalProfit);
    console.log(actionValueDict);
    console.log(yValues);
    console.log(xValues);
});
```