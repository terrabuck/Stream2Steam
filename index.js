
const express = require('express');
const app = express();
const got = require('got');
const _ = require('lodash');

const twitchApi = 'https://api.twitch.tv/kraken'
const steamApi = 'https://api.steampowered.com/ISteamApps/GetAppList/v2' 
const clientId = ''
const updateInterval = 1000 * 60 * 1440; // steam database update interval
const streamer = 'shroud'


// This creates a local cache of the AppList
const games = new Map();


// Get initial steam catalog list
getCatalog()
.then(() => {
	console.log('Received initial list of games POGGERS');
})
.then(() => getAppid(streamer))
.then(gameId => {
  console.log(gameId)
});


// Update steam catalog once per day
setInterval(() => {
  console.log('Updating game cache..');
	getCatalog()
  .then(() => {
  	console.log('Done updating game cache');
  });
}, updateInterval);


// Get game of a twitch channel
twitchGame(streamer)
    .then(game => console.log('Received information from the stream'))
    .catch(err => console.log('Something went wrong'));



// Get steam app ID for the streamer's game
getAppid(streamer)
    .then(result => console.log(`Current game: ${result.game}. Check it out on steam: https://store.steampowered.com/app/${result.gameId}`)
    .catch(err => console.log('Something is scuffed FeelsBadMan')));


    
function twitchGame(streamer) {
    return got.get(`${twitchApi}/streams/${streamer}?client_id=${clientId}`, {
        json: true
    })
    .then(result => {
        const { stream } = result.body;

        if (!stream) {
            return Promise.reject(new Error('Stream is offline'));
        }

        const { game } = stream;

        if (!game) {
            return Promise.reject(new Error('No game is set for this channel'));
        }

        return game
    })
    .catch(err => Promise.reject(err));
}

function getCatalog() {
    return got.get(steamApi, {
        json: true
    })
    .then(result => {
    	if (!result) {
      	throw new Error('Failed to get list of games');
      }
      
      const apps = result.body.applist.apps;
      
      _.each(apps, game => {
				games.set(game.name, game.appid);
      });
      
      return Promise.resolve();
    })
}

function getAppid() {
		return twitchGame(streamer)
    .then(game => {
    	const gameId = games.get(game);
      
        if (!gameId) {
            return Promise.reject(new Error('No app found'));
        }

        return  {game, gameId}
    })
    .catch(err => console.log(err))
}