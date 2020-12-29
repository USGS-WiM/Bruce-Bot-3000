'use strict';



function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

async function getPhraseAndHoliday() {
    // default answer
    var result = "Today we failed getting the holiday information, for some reason. Regardless, check in!";

    // first half, generate a random phrase from the given text file
    const fs = require('fs');

    // load the file
    try {
        var data = fs.readFileSync('WIM-quotable-quotes_2020-12-28.txt', 'utf8');
    } catch (e) {
        console.log('Problem loading the requested file. ', e.stack);
    }
    // a array of all the phrases
    var phrases = data.split('\n');
    var numberOfPhrases = phrases.length;
    var random = randomNumber(0, numberOfPhrases - 1);
    // gets a random phrase
    var randomPhrase = phrases[random];
    // makes sure any phrase containting ':name:' is removed
    randomPhrase = randomPhrase.split(':')[0];



    // second half, generate a random holiday for the current day
    const request = require('request-promise');
    const $ = require('cheerio');


    var date = new Date();
    var months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

    var month = date.getMonth();
    var day = date.getDate();

    var currentMonth = months[month];

    var url = "http://www.holidayscalendar.com/day/" + currentMonth + "-" + day + "/";
    //var url = "http://www.holidayscalendar.com/day/march-14/";

    
    await request(url)
        .then(function (html) {
            // success
            var table = $('tr > td', html);
    
            // should both be equal in length when all is said and done
            var holidays = [];
            var locations = [];
    
            for (var i = 0; i < table.length; i++) {
                if ((i % 3) == 0) {
                    holidays.push($(table[i]).text());
                }
                if (i > 0) {
                    if (((i - 1) % 3) == 0) {
                        locations.push($(table[i]).text());
                    }
                }
            }
            
            var randomNumber = Math.floor(Math.random() * ((holidays.length)));
            var holidayToday = holidays[randomNumber];
            holidayToday = holidayToday.split('*')[0].trim().split('observed')[0].trim();
            var location = locations[randomNumber].trim();
            if (location == "-") {
                location = "no particular location";
            }
            else if (location == "Multiple [Show]") {
                location = "many different places";
            }
            result = randomPhrase + "\n" + "Today's featured holiday (celebrated in " + location + ") is " + holidayToday + ", in case you wanted to know. Now sign in!";
        })
        .catch(function (err) {
            // problem accessing the site/accessing the contents
            console.log(err);
        });
    return result; 
}

const dotenv = require('dotenv')
dotenv.config()

const { App } = require('@slack/bolt');
const bot = new App({
    token: process.env.BOT_TOKEN,
    signingSecret: process.env.SIGNING_SECRET,
    name: 'Bruce Bot 3000'
});


async function schedule(client, channel_id) {
    const t = await getPhraseAndHoliday();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0);

    const epochTime = Math.round(Date.now() / 1000);
    const endTime = epochTime + 50;
    try {
        // Call chat.scheduleMessage with the built-in client
        const result = await client.chat.scheduleMessage({
            channel: channel_id,
            post_at: endTime,
            text: t
        });
        console.log(result);
        //schedule(client, channel_id);
    }
    catch (error) {
        console.error(error);
    }
}


bot.message('I want reminders!', async ({ message, say, client }) => {
    // say() sends a message to the channel where the event was triggered
    if (message.channel_id == client.im.channel_id) {
        await say("You've signed up to receive Bruce Bot reminders!");
        schedule(client, message.channel);
    }   
});



(async () => {
    await bot.start(3000); // Launch the bot
    console.log("Bolt app is running!");
})();


//open(url);

