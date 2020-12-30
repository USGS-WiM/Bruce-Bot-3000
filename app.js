'use strict';

const https = require('https');

// only custom thing we need to change for the specific channel we want to use. This webhook links up to one of my channels on my page
const webHookURL = "ENTER YOUR WEB HOOK URL HERE";


// we can create a loop in here if we want so it sends a message every day, or use aws lambda
(async function () {

    console.log('Sending slack message');
    try {
        const message = await getPhraseAndHoliday(new Date());
        const slackResponse = await sendSlackMessage(webHookURL, message);
        console.log('Message response', slackResponse);
    } catch (e) {
        console.error('There was a error with the request', e);
    }
})();


function sendSlackMessage(webHookURL, message) {

    const messageBody = {
        username: 'Bruce Bot Reminder', // This will appear as user name who posts the message
        text: message // text
    };

    console.log("Attemping to send this message: \n" + message);

    const jsonMessage = JSON.stringify(messageBody);

    // Promisify the https.request
    return new Promise((resolve, reject) => {
        // general request options, we defined that it's a POST request and content is JSON
        const requestOptions = {
            method: 'POST',
            header: {
                'Content-Type': 'application/json'
            }
        };

        // try the request
        const req = https.request(webHookURL, requestOptions, (res) => {
            let response = '';


            res.on('data', (d) => {
                response += d;
            });

            // response finished, resolve the promise with data
            res.on('end', () => {
                resolve(response);
            })
        });

        // there was an error, reject the promise
        req.on('error', (e) => {
            reject(e);
        });

        // send our message body (was parsed to JSON beforehand)
        req.write(jsonMessage);
        req.end();
    });
}


/**
 * Function that parses the "quotable-quotes" file and finds a random quote, then combines that quote with a random holiday that occurs
 * on the given Date. Currently scrapes holidaycalendars.com to gather holiday information
 * @param {any} date the Date object of the particular day one wants to gather holiday information from
 */
async function getPhraseAndHoliday(date) {
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
    var random = Math.floor(Math.random() * numberOfPhrases);
    // gets a random phrase
    var randomPhrase = phrases[random];
    // makes sure any phrase containting ':name:' is removed
    randomPhrase = randomPhrase.split(':')[0];



    // second half, generate a random holiday for the current day
    const request = require('request-promise');
    const $ = require('cheerio');

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

            /* loops through the table and adds every third element (starting at the first element) to the holidays table,
             * and also starts at element two and goes to every third element from there on out and adds that to the locations table
             */
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

            var random = Math.floor(Math.random() * ((holidays.length)));
            var holidayToday = holidays[random];
            holidayToday = holidayToday.split('*')[0].trim().split('observed')[0].trim();
            var location = locations[random].trim();
            // some of the table information is blank, so in that case we add our own touch
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

