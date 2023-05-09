/**
 * Copyright 2021-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Messenger Platform Quick Start Tutorial
 *
 * This is the completed code for the Messenger Platform quick start tutorial
 *
 * https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
 *
 * To run this code, you must do the following:
 *
 * 1. Deploy this code to a server running Node.js
 * 2. Run `yarn install`
 * 3. Add your VERIFY_TOKEN and PAGE_ACCESS_TOKEN to your environment vars
 */

'use strict';

// Use dotenv to read .env vars into Node
require('dotenv').config();

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const APP_URL = process.env.APP_URL;

// Imports dependencies and set up http server
const
  Response = require('./Response'),
  request = require('request'),
  express = require('express'),
  { urlencoded, json } = require('body-parser'),
  i18n = require("./i18n.config"),
  dayjs = require('dayjs'),
  utc = require('dayjs/plugin/utc'),
  timezone = require('dayjs/plugin/timezone'),
  duration = require('dayjs/plugin/duration'),
  localizedFormat = require('dayjs/plugin/localizedFormat'),
  app = express();

// Parse application/x-www-form-urlencoded
app.use(urlencoded({ extended: true }));

// Parse application/json
app.use(json());

// Enable the UTC, timezone, duration, and localizedFormat plugins for day.js
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);
dayjs.extend(duration);

var users = {};
var usersLastAutoReplyText = {} // Store the last auto-reply time for each user
var usersLastAutoReplyAttachment = {} 
var lastPayload = {} 

// Set the auto-reply interval to 2 hours
const autoReplyInterval = dayjs.duration(2, 'minutes').asMilliseconds();

// Respond with 'Hello World' when a GET request is made to the homepage
app.get('/', function (_req, res) {
  res.send('Hello World');
});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {

    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Responds with the challenge token from the request
      // console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

// Creates the endpoint for your webhook
app.post('/webhook', (req, res) => {
  // Parse the request body from the POST
  let body = req.body;

  console.log("get started", body, body.entry[0].messaging)

  // Checks if this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(async function(entry) {

        // Get the webhook event. entry.messaging is an array, but 
        // will only ever contain one event, so we get index 0
        let webhookEvent = entry.messaging[0];

        // Get the sender PSID
        let senderPsid = webhookEvent.sender.id;
        // console.log('Sender PSID: ' + senderPsid);
        // console.log('hihi: ' + webhookEvent);

        // Check if user is guest from Chat plugin guest user
        let guestUser = isGuestUser(webhookEvent);

        if (users[senderPsid]){
            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhookEvent.message) {
              handleMessage(senderPsid, webhookEvent);
            } 
            else if (webhookEvent.postback) {
              handlePostback(senderPsid, webhookEvent.postback);
            }
        }
        else {
          getUserProfile(senderPsid)
          .then( (user) => {
            users[senderPsid] = user
  
            // console.log("user isssss", user)
  
            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhookEvent.message) {
              handleMessage(senderPsid, webhookEvent);
            } 
            else if (webhookEvent.postback) {
              handlePostback(senderPsid, webhookEvent.postback);
            }
          })
          .catch( e => {
            console.log("Error retrieving user", e)
          })
        }













      // entry.messaging.forEach(async function (webhookEvent) {
      //   // Get the sender PSID
      //   let senderPsid = webhookEvent.sender.id;
      //   // Get the user_ref if from Chat plugin logged in user
      //   let user_ref = webhookEvent.sender.user_ref;
      //   // Check if user is guest from Chat plugin guest user
      //   let guestUser = isGuestUser(webhookEvent);
    
      //   console.log("hoho b4 if", senderPsid, user_ref, guestUser)

      //   getUserProfile(senderPsid).then((userProfile)=>{
      //     console.log("idk eh lmao", userProfile)

      //     // Get the webhook event. entry.messaging is an array, but 
      //     // will only ever contain one event, so we get index 0
      //     let webhookEvent = entry.messaging[0];
      //     console.log(webhookEvent);

      //     // Get the sender PSID
      //     let senderPsid = webhookEvent.sender.id;
      //     console.log('Sender PSID: ' + senderPsid);
      //     console.log('hihi: ' + webhookEvent);

      //     // Check if the event is a message or postback and
      //     // pass the event to the appropriate handler function
      //     if (webhookEvent.message) {
      //       handleMessage(senderPsid, webhookEvent.message);
      //     } else if (webhookEvent.postback) {
      //       handlePostback(senderPsid, webhookEvent.postback);
      //     }
      //   })
      //   .catch( e => {
      //     console.log("Error in getting user", e)
      //   })
    
    
      //   // if (senderPsid != null && senderPsid != undefined) {
      //   //   if (!(senderPsid in {})) {
      //   //     if (!guestUser) {
      //   //       // Make call to UserProfile API only if user is not guest
      //   //       // let user = new User(senderPsid);
      //   //       // GraphApi.getUserProfile(senderPsid)
      //   //       //   .then((userProfile) => {
      //   //       //     user.setProfile(userProfile);
      //   //       //   })
      //   //       //   .catch((error) => {
      //   //       //     // The profile is unavailable
      //   //       //     console.log(JSON.stringify(body));
      //   //       //     console.log("Profile is unavailable:", error);
      //   //       //   })
      //   //       //   .finally(() => {
      //   //       //     console.log("locale: " + user.locale);
      //   //       //     users[senderPsid] = user;
      //   //       //     i18n.setLocale("en_US");
      //   //       //     console.log(
      //   //       //       "New Profile PSID:",
      //   //       //       senderPsid,
      //   //       //       "with locale:",
      //   //       //       i18n.getLocale()
      //   //       //     );
      //   //       //     return receiveAndReturn(
      //   //       //       users[senderPsid],
      //   //       //       webhookEvent,
      //   //       //       false
      //   //       //     );
      //   //       //   });
      //   //     } else {
      //   //       // setDefaultUser(senderPsid);
      //   //       // return receiveAndReturn(users[senderPsid], webhookEvent, false);
      //   //     }
      //   //   } else {
      //   //     // i18n.setLocale(users[senderPsid].locale);
      //   //     // console.log(
      //   //     //   "Profile already exists PSID:",
      //   //     //   senderPsid,
      //   //     //   "with locale:",
      //   //     //   i18n.getLocale()
      //   //     // );
      //   //     // return receiveAndReturn(users[senderPsid], webhookEvent, false);
      //   //   }
      //   // } 
      //   // else if (user_ref != null && user_ref != undefined) {
      //   //   // Handle user_ref
      //   //   // setDefaultUser(user_ref);
      //   //   // return receiveAndReturn(users[user_ref], webhookEvent, true);
      //   //   console.log("hoho in else if")
      //   // }

  
      //   }
      //   )
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {

    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

async function getUserProfile(senderIgsid) {
  let url = new URL(`https://graph.facebook.com/${senderIgsid}`);
  url.search = new URLSearchParams({
    access_token: PAGE_ACCESS_TOKEN,
    fields: "first_name, last_name, gender, locale, timezone"
  });

  let response = await fetch(url);

  if (response.ok) {
    let userProfile = await response.json();
    return {
      firstName: userProfile.first_name,
      lastName: userProfile.last_name,
      gender: userProfile.gender,
      locale: userProfile.locale,
      timezone: userProfile.timezone
    };
  } 
  else {
    console.warn(
      `Could not load profile for ${senderIgsid}: ${response.statusText}`,
      await response.json()
    );
    return null;
  }
}

function isGuestUser(webhookEvent) {
  let guestUser = false;
  if ("postback" in webhookEvent) {
    if ("referral" in webhookEvent.postback) {
      if ("is_guest_user" in webhookEvent.postback.referral) {
        guestUser = true;
      }
    }
  }
  return guestUser;
}



// Handles messages events
function handleMessage(senderPsid, event) {
  let response;

  let receivedMessage = event.message;

  if (receivedMessage.quick_reply){
    switch(receivedMessage.quick_reply.payload){
      case("OFFER"):
      case("PLANS"):
      case("PRICING"):
      case("SUPPORT"):
      case("OTHER_ENQUIRIES"):
      case("DONE"):
        Response.handleSelectOption(receivedMessage.quick_reply.payload, senderPsid)
        lastPayload = receivedMessage.quick_reply.payload;
        break;
      default:
        console.warn("Error, unknown quick reply payload: ", receivedMessage.quick_reply.payload)
        break;
    }
    
    return;
  }
  else {
    const currentTime = dayjs.utc(event.timestamp).tz('Asia/Kuala_Lumpur');

    const lastAutoReplyTimeText = usersLastAutoReplyText[senderPsid];
    const lastAutoReplyTimeAttachment = usersLastAutoReplyAttachment[senderPsid];

    const timeSinceLastAutoReplyText = lastAutoReplyTimeText ? currentTime.diff(lastAutoReplyTimeText, 'milliseconds') : autoReplyInterval;
    const timeSinceLastAutoReplyAttachment = lastAutoReplyTimeAttachment ? currentTime.diff(lastAutoReplyTimeAttachment, 'milliseconds') : autoReplyInterval;

    // If last auto reply time till now has exceeded the interval

    if (timeSinceLastAutoReplyText >= autoReplyInterval && 
      (receivedMessage.text || lastPayload === 'OTHER_ENQUIRIES')
    ){
        response = { text: i18n.__("received") };

        // Update the last auto-reply time for the user
        usersLastAutoReplyText[senderPsid] = currentTime.format();

        // reset
        if (lastPayload === 'OTHER_ENQUIRIES')
          lastPayload = ''
      
    }
    else if (timeSinceLastAutoReplyAttachment >= autoReplyInterval &&
      receivedMessage.attachments
    ){          
      // Get the URL of the message attachment
      let attachmentUrl = receivedMessage.attachments[0].payload.url;
      // response = {
      //   'attachment': {
      //     'type': 'template',
      //     'payload': {
      //       'template_type': 'generic',
      //       'elements': [{
      //         'title': 'Is this the right picture?',
      //         'subtitle': 'Tap a button to answer.',
      //         'image_url': attachmentUrl,
      //         'buttons': [
      //           {
      //             'type': 'postback',
      //             'title': 'Yes!',
      //             'payload': 'yes',
      //           },
      //           {
      //             'type': 'postback',
      //             'title': 'No!',
      //             'payload': 'no',
      //           }
      //         ],
      //       }]
      //     }
      //   }
      // };
      
      // Update the last auto-reply time for the user
      usersLastAutoReplyAttachment[senderPsid] = currentTime.format();
      
      Response.handleAttachment(attachmentUrl, senderPsid);
      return
    }

    // Haven't exceed, don't send anything
    else{
      return false;
    }
  }

  // Send the response message
  Response.callSendAPI(senderPsid, response);
}

// Handles messaging_postbacks events
function handlePostback(senderPsid, receivedPostback) {
  let response;

  // Get the payload for the postback
  let payload = receivedPostback.payload;

  // User selects Main Menu from the persistent menu
  if (payload === 'persistent_menu'){
    const currentLocale = i18n.getLocale()
    payload = currentLocale;
  }

  // Set the response based on the postback payload
  lastPayload = payload;
  switch(payload){
    case ("get_started"):
      response = {
        'attachment': {
          'type': 'template',
          'payload': {
            'template_type': 'button',
            // 'text': `Hi ${users[senderPsid].firstName || ''}, before we proceed, please choose your preferred language.`,
            'text': i18n.__("language", {userFirstName: users[senderPsid].firstName}),
            'buttons': [
              {
                'type': 'postback',
                'title': 'English',
                'payload': 'en_US',
              },
              {
                'type': 'postback',
                'title': 'Malay',
                'payload': 'ms_MY',
              },
              {
                'type': 'postback',
                'title': 'Chinese',
                'payload': 'zh_CN',
              }
            ],
          }
        }
      };
      break;

    //   break;
    case ("yes"):
      response = { 'text': 'Thanks!' };
      break;
    case ("no"):
      response = { 'text': 'Oops, try sending another image.' };
      break;


    case ("zh_CN"):
      return Response.handleSelectLanguage("zh_CN", users[senderPsid], senderPsid);
    case ("ms_MY"):
      return Response.handleSelectLanguage("ms_MY", users[senderPsid], senderPsid);
    case ("en_US"):
      return Response.handleSelectLanguage("en_US", users[senderPsid], senderPsid);
    
    default:
      response = { 'text': 'Unknown payload: ' + payload}
      break;
  }
  // Send the message to acknowledge the postback
  Response.callSendAPI(senderPsid, response);
}


// listen for requests :)
var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
