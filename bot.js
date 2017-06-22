const Botmaster = require('botmaster');
const axios = require('axios');
const _ = require('lodash');

require('dotenv').config();

const botmaster = new Botmaster({port : process.env.PORT || 5000});
const SessionWare = require('botmaster-session-ware');

// @todo Add more clients later!
const TwitterBot = require('botmaster-twitter-dm');

const twitterSettings = {
  credentials: {
    consumerKey: process.env.TWITTER__CONSUMERKEY,
    consumerSecret: process.env.TWITTER__CONSUMERSECRET,
    accessToken: process.env.TWITTER__ACCESSTOKEN,
    accessTokenSecret: process.env.TWITTER__ACCESSTOKENSECRET,
  }
};
botmaster.addBot(new TwitterBot(twitterSettings));

const sessionWare = SessionWare();
botmaster.useWrapped(sessionWare.incoming, sessionWare.outgoing);


const fetchRandomRecipe = () => {
  return axios.get('http://127.0.0.1:8888/api/recipes?page[limit]=20')
    .then(res => res.data.data)
    .then(entries => _.map(entries, entry => entry.attributes))
    .then(recipes => recipes[_.random(0, recipes.length - 1)])
};


botmaster.use({
  type: 'incoming',
  name: 'my-example-recipe',
  controller: (bot, update) => {
    // Help with knowing what to cook.
    if (update.message.text.indexOf('What') !== -1 && update.message.text.indexOf('cook') !== -1) {
      fetchRandomRecipe()
        .then(recipe => {
          update.session.recipe = recipe;
          bot.reply(update, recipe.title)
            .catch(console.error);
        })
        .catch(console.error);
    }
    // Show the ingredients
    if (update.message.text.indexOf('ingredients') !== -1) {
      update.session.recipe.ingredients.forEach((ingredient) => {
        bot.reply(update, ingredient)
          .catch(console.error);
      });
    }
    // Show the instructions
    if (update.message.text.indexOf('instructions') !== -1) {
      bot.reply(update, update.session.recipe.instructions)
        .catch(console.error);
    }
  }
});

