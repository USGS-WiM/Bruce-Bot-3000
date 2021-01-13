'use strict';

const https = require('https');

// only custom thing we need to change/add for the specific channel we want to use. This webhook links up to one of my channels on my page
const webHookURL = "YOUR WEBHOOK HERE";

// create a blank new Date, referring to today (whenever this program is run)
var date = new Date();
// we can create a loop in here if we want so it sends a message every day, or use aws lambda
(async function () {

    try {
        const message = await getPhraseAndHoliday(date);
        const slackResponse = await sendSlackMessage(webHookURL, message);
        console.log('Message response', slackResponse);
    } catch (e) {
        console.error('There was a error with the request', e);
    }
})();



/**
 * Function that sends a message to a specific slack channel  via the given webhook url
 * @param {any} webHookURL the Web hook URL we are using to send a message to a specific channel
 * @param {any} message the message we want to send
 */
function sendSlackMessage(webHookURL, message) {

    console.log('Sending slack message');

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

    var result = "Happy " + day + "!\n";
    var bruceFailure = "Unfortunately an error prevented us from gathering a Bruce quote for today.\n";
    var holidayFailure = "Unfortunately an error prevented us from gathering a featured holiday for today.\n";

    // first half, generate a random holiday for the current day using the json file
    var months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

    var day = "" + months[date.getMonth()] + "_" + date.getDate();

    // gather holiday information from the holiday file stored in the S3
    const AWS = require('aws-sdk');
    const s3 = new AWS.S3({
        accessKeyId: "ACCESS KEY HERE",
        secretAccessKey: "SECRET ACCESS KEY HERE",
        Bucket: "NAME"
    });
    var params = {
        Bucket: "NAME",
        Key: "holidays" + date.getFullYear() + ".json"
    };
    const fs = require('fs');

    // attempt to gather holiday information from s3
    var worked = false;
    try {
        var info = "test";

        const d = await new Promise((resolve, reject) => {
            s3.getObject(params, function (err, data) {
                if (!err) {
                    const body = Buffer.from(data.Body).toString('utf8');
                    info = body;
                    resolve(data);
                }
                else {
                    reject(data);
                    throw "Error grabbing info from the holiday files from s3.";
                }
            })
        });
        if (info == "test") {
            throw "Error grabbing info from holiday files from s3";
        }
        // change all of the string info into a JSON variable
        info = JSON.parse(info);

        var values = "";
        // find the value at the day we want
        for (var i in info) {
            if (i.trim() == day) {
                values = info[i];
                worked = true;
            }
        }
        
    } catch (e) {
        console.log("Problem loading the holiday file. ", e.stack);
        worked = false;
    }

    if (worked) {
        // now that we have the holidays for the given date in an array, we can randomly choose one
        var fullHoliday = values[(Math.floor(Math.random() * values.length))];
        var holiday = fullHoliday.split(",")[0];

        var location = fullHoliday.split(",")[1];
        if (location == " no particular location") {
            location = " no particular region";
        }

        result += "Today's featured holiday is " + holiday + ".\n\n";
    } else {
        result += holidayFailure;
    }


    // second half, generate a random bruce phrase from the given text file
    //const fs = require('fs');
    // load the file
    try {
        // changes params so now it will look at the quotables file
        params = {
            Bucket: "HERE",
            Key: "WIM-quotable-quotes_2020-12-28.txt"
        };

        info = "test";

        const d = await new Promise((resolve, reject) => {
            s3.getObject(params, function (err, data) {
                if (!err) {
                    const body = Buffer.from(data.Body).toString('utf8');
                    info = body;
                    resolve(data);
                }
                else {
                    reject(data);
                    throw "Error grabbing info from the holiday files from s3.";
                }
            })
        });
        if (info == "test") {
            throw "Error grabbing info from holiday files from s3";
        }

        var data = info;

        // a array of all the phrases
        var phrases = data.split('\n');
        var numberOfPhrases = phrases.length;
        var random = Math.floor(Math.random() * numberOfPhrases);
        // gets a random phrase
        var randomPhrase = phrases[random];
        // makes sure any phrase containting ':name:' is removed
        result += ":wim: WIM quote of the day :wim:\n" + randomPhrase + "";
    } catch (e) {
        console.log('Problem loading the requested file. ', e.stack);
        result += bruceFailure;
    }
    return result;
}


function printAllDays() {
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    // first half, generate a random holiday for the current day using the json file
    var months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
}

/**
 * Function used to download the holiday information and store them in json files. Not used when running the program, only to download
 * more holidays for upcoming years. Note: very few comments for the code of this function
 * @param {any} year the year of holidays we want to jsonify
 */
async function jsonify(year) {
    const allHolidays = require("./holidays2024.json");
    var everyHoliday = [];

    var worked = false;
    try {
        var values = "";

        for (var i in allHolidays) {
            var stringVersion = JSON.stringify(allHolidays[i]);
            stringVersion = stringVersion.split("[")[1];
            stringVersion = stringVersion.split("]")[0];
            stringVersion = stringVersion.split(",")[0];
            stringVersion = stringVersion.replace('"', '');
            everyHoliday.push(stringVersion);
        }

    } catch (e) {
        console.log("Problem loading the holiday file. ", e.stack);
    }



    const fs = require('fs');
    var logger = fs.createWriteStream('holidays' + year + '.json', {
        flags: 'a' // 'a' means appending (old data will be preserved)
    })

    const request = require('request-promise');
    const $ = require('cheerio');

    var months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

    var currentURL = "";
    var stringForJSONFile = "{ \n";

    var day = 1;
    var month = 0;
    var max_days = 365;
    var leap_day = 0;
    if ((year % 4) == 0) {
        max_days = 366;
        leap_day = -1;
    }
    
    for (var i = 1; i < max_days + 1; i++) {

        if (day == 32 && month == 0) {
            month = 1;
            day = 1;
        } else if ((day + leap_day) == 29 && month == 1) {
            month = 2;
            day = 1;
        } else if (day == 32 && month == 2) {
            month = 3;
            day = 1;
        } else if (day == 31 && month == 3) {
            month = 4;
            day = 1;
        } else if (day == 32 && month == 4) {
            month = 5;
            day = 1;
        } else if (day == 31 && month == 5) {
            month = 6;
            day = 1;
        } else if (day == 32 && month == 6) {
            month = 7;
            day = 1;
        } else if (day == 32 && month == 7) {
            month = 8;
            day = 1;
        } else if (day == 31 && month == 8) {
            month = 9;
            day = 1;
        } else if (day == 32 && month == 9) {
            month = 10;
            day = 1;
        } else if (day == 31 && month == 10) {
            month = 11;
            day = 1;
        }

        currentURL = "http://www.holidayscalendar.com/day/" + months[month] + "-" + day + "-" + year + "/";
        await request(currentURL)
            .then(function (html) {

                stringForJSONFile += '"' + months[month] + '_' + day + '": [ \n     ';

                var table = $('tr > td', html);
                var holiday = "";
                var location = "";
                var useInstead = stringForJSONFile;
                var useFlag = false;

                /* loops through the table and adds every third element (starting at the first element) to the holidays table,
                 * and also starts at element two and goes to every third element from there on out and adds that to the locations table
                 */
                outerloop:
                for (var i = 0; i < table.length; i++) {
                    if ((i % 3) == 0) {
                        holiday = $(table[i]).text().trim();
                        for (var k = 0; k < everyHoliday.length; k++) {
                            // if the holiday matches one of the known holidays, add that to the json 
                            if (everyHoliday[k].trim() === holiday.trim()) {
                                location = $(table[i + 1]).text().trim();
                                
                                if (location == "-") {
                                    location = "no particular location";
                                }
                                else if (location == "Multiple [Show]") {
                                    location = "many different places";
                                }
                                useInstead += '"' + holiday + ', ' + location + '"\n     '; 
                                useFlag = true;
                                break outerloop;
                            }
                        }
                        stringForJSONFile += '"' + holiday + ', ';
                    }
                    if (i > 0) {
                        if (((i - 1) % 3) == 0) {
                            location = $(table[i]).text().trim();
                            if (location == "-") {
                                location = "no particular location";
                            }
                            else if (location == "Multiple [Show]") {
                                location = "many different places";
                            }
                            if (i + 3 >= table.length) {
                                stringForJSONFile += location + '"\n     ';
                            }
                            else {
                                stringForJSONFile += location + '",\n     ';
                            }
                        }
                    }
                }


                if (i == max_days) {
                    stringForJSONFile += ']\n';
                    useInstead += ']\n';
                }
                else {
                    stringForJSONFile += '],\n';
                    useInstead += '],\n';
                }


                if (useFlag) {
                    logger.write(useInstead);
                    useInstead = "";
                    stringForJSONFile = "";
                }
                else {
                    logger.write(stringForJSONFile);
                    useInstead = "";
                    stringForJSONFile = "";
                }


            })
            .catch(function (err) {
                // problem accessing the site/accessing the contents
                console.log(err);
            });
        day++;
    }
    
    logger.write("\n}");
    logger.close();
}



/**
 * Function that web scrapes a holiday for a particular day. Not used in this program
 * @param {any} date the particular date we want to get the holiday for
 */
async function webscrape(date) {
    // second half, generate a random holiday for the current day

    var result = "";

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