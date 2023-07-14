const { retrieveConnection } = require('../database/database')
const { registerPlayerFromEndpoint } = require('../database/dbFunctions/register')
const { countAsResultForPlayer } = require('./counters')

async function calculateWinners() {
  let con = await retrieveConnection();
  if (con) {
    // Realiza operaciones con la conexión a la base de datos
    // Ejemplo: con.query('SELECT * FROM tabla', function(err, result) { ... });
    let scoreRound = []
    let steamIdArr = []
    let nickArr = []
    const matchesResult = {
      win: "Win",
      lose: "Lose",
      tie: "Tie"
    }
    let queryRounds = `SELECT * FROM tfc.partidas WHERE Espectadores != 'Specs' AND Mapname = (SELECT Mapname FROM tfc.partidas WHERE Espectadores != 'Specs' ORDER BY Fecha DESC LIMIT 1) AND CHAR_LENGTH(Equipo1) > 12 AND CHAR_LENGTH(Equipo2) > 12 ORDER BY Fecha DESC LIMIT 2;`;
    const getResults = () => {
      return new Promise((resolve, reject) => {
        con.query(queryRounds, function (err, result) {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    }
    await getResults()
      .then((result) => {
        result.forEach((e, i) => {
          scoreRound[i] = parseInt(e.CapturasAzul)
          steamIdArr[i] = e.Equipo1_steamId.replace(/\s-\s?$/g, "").split(" - ");
          nickArr[i] = e.Equipo1.replace(/\s-\s?$/g, "").split(" - ");
        });
      })
      .catch((err) => {
        console.log(`Error retrieving data from the database at rankings ${err}`)
      })
    console.log("checking scoreround");
    console.log("scoreround is ");
    console.log(scoreRound);
    if (scoreRound.length < 2) {
      console.log("Not enought rounds to evaluate")
      return;
    }
    if (scoreRound[0] > scoreRound[1]) {
      console.log("checking loadresult1");
      loadPlayersResults(steamIdArr[0], nickArr[0], matchesResult.win)
      loadPlayersResults(steamIdArr[1], nickArr[1], matchesResult.lose)
    }
    if (scoreRound[0] < scoreRound[1]) {
      console.log("checking loadresult2");
      loadPlayersResults(steamIdArr[1], nickArr[1], matchesResult.win)
      loadPlayersResults(steamIdArr[0], nickArr[0], matchesResult.lose)
    }
    if (scoreRound[0] == scoreRound[1]) {
      console.log("checking loadresult3");
      loadPlayersResults(steamIdArr[1], nickArr[1], matchesResult.tie)
      loadPlayersResults(steamIdArr[0], nickArr[0], matchesResult.tie)
    }
  
  } else {
    console.log("Database is not connected.");
  }
}

function loadPlayersResults(steamIdArr, nickArr, condition) {
  steamIdArr.forEach(async (s, i) => {
    try {
      registerPlayerFromEndpoint(s, nickArr[i], condition);
    } catch (error) {
      console.log("Error: " + error);
    }
  })
}
module.exports = { calculateWinners }