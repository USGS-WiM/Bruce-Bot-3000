'use strict';


// first half, generate a random phrase from the given text file
const fs = require('fs');
//const dotenv = require('dotenv')
//dotenv.config()


function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

// load the file
try {
    var data = fs.readFileSync('WIM-quotable-quotes_2020-12-28.txt', 'utf8');
} catch (e) {
    console.log('Problem loading the requested file. ', e.stack);
}
// a array of all the phrases
var phrases = data.split('\n');
var numberOfPhrases = phrases.length;
var randomNumber = randomNumber(0, numberOfPhrases - 1);
// gets a random phrase
var randomPhrase = phrases[randomNumber];
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

request(url)
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

        console.log(randomPhrase + "\n" + "Today's featured holiday (celebrated in " + location + ") is " + holidayToday + ", in case you wanted to know. Now sign in!");
    })
    .catch(function (err) {
        // problem accessing the site/accessing the contents
        console.log(err);
    });

/*
const SlackBot = require('slackbots');
const bot = new SlackBot({
    token: `${process.env.BOT_TOKEN}`,
    name: 'holiday_reminder'
})
*/

//open(url);

