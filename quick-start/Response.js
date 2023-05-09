"use strict";

// Use dotenv to read .env vars into Node
require('dotenv').config();

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const APP_URL = process.env.APP_URL;

const
    request = require('request'),
    i18n = require("./i18n.config");
    // fetch = require('node-fetch');

module.exports = class Response {
    static getMainMenuOptions(showNoFurtherQuestions = false, showPricing = false){
        let options = [
            {
              content_type: "text",
              title: i18n.__("menu.offer"),
              payload: "OFFER"
            },
            {
                content_type: "text",
                title: i18n.__("menu.plans"),
                payload: "PLANS"
            },
            {
                content_type: "text",
                title: i18n.__("menu.support"),
                payload: "SUPPORT"
            },
            {
                content_type: "text",
                title: i18n.__("menu.other_enquiries"),
                payload: "OTHER_ENQUIRIES"
            }
        ];

        if (showNoFurtherQuestions)
            options = options.concat([
                {
                    content_type: "text",
                    title: i18n.__("menu.done"),
                    payload: "DONE"
                }
            ])

        if (showPricing)
            options.unshift(
                {
                    content_type: "text",
                    title: i18n.__("menu.pricing"),
                    payload: "PRICING"
                }
            )

        return options;
    }

    static async handleSelectLanguage(locale = "en_US", user, senderPsid){
        i18n.setLocale(locale)

        let response;
        response = [
            { text: i18n.__("message.thank", {userFirstName: user.firstName}) },
        ];
        response = response.concat([{
            text: i18n.__("message.choose"),
            quick_replies: Response.getMainMenuOptions(false)
        }]);

        // sending multiple message on one postback: https://stackoverflow.com/a/47497119
        // this.callSendAPI(senderPsid, response[0]).then(() =>{
        //     return this.callSendAPI(senderPsid, response[1])
        // })

        for (let i = 0; i < response.length; i++){
            await this.callSendAPI(senderPsid, response[i])
        }

        return response;
    }

    static async handleSelectOption(payload, senderPsid){
        let response;
        switch (payload){
            case ("OFFER"):
                response = [
                    { text: i18n.__("offer.intro") },
                    { text: i18n.__("offer.use") },
                    { text: i18n.__("offer.link") },
                ];
                response = response.concat([{
                    text: i18n.__("message.choose_other"),
                    quick_replies: Response.getMainMenuOptions(true, false)
                }]);
                break;
            case("PLANS"):
                response = [
                    { text: i18n.__("plans.list") },
                    { text: i18n.__("plans.packages") },
                    { text: i18n.__("trial") },
                ];
                response = response.concat([{
                    text: i18n.__("message.choose_other"),
                    quick_replies: Response.getMainMenuOptions(true, true)
                }]);
                break;
            case("PRICING"):
                response = [
                    { text: i18n.__("pricing.intro") },
                    { text: i18n.__("pricing.link") },
                    { text: i18n.__("trial") },
                ];
                response = response.concat([{
                    text: i18n.__("message.choose_other"),
                    quick_replies: Response.getMainMenuOptions(true, false)
                }]);
                break;
            case("SUPPORT"):
                response = [
                    { text: i18n.__("support") }
                ]
                // response = response.concat([
                //     {
                //         'attachment': {
                //             'type': 'template',
                //             'payload': {
                //               'template_type': 'generic',
                //               'elements': [{
                //                 'image_url': `${APP_URL}/images/chat_button_screenshot.jpeg`,
                //               }]
                //             }
                //           }
                //     }
                // ])
                response = response.concat([{
                    text: i18n.__("message.choose_other"),
                    quick_replies: Response.getMainMenuOptions(true, false)
                }]);
                break;
            case("OTHER_ENQUIRIES"):
                response = [
                    { text: i18n.__("input") }
                ]
                // response = response.concat([{
                //     text: i18n.__("message.choose_other"),
                //     quick_replies: Response.getMainMenuOptions(true, false)
                // }]);
                break;
            case("DONE"):
                response = [
                    { text: i18n.__("done") }
                ]
                break;
        }

        for (let i = 0; i < response.length; i++){
            await this.callSendAPI(senderPsid, response[i])
        }

        if (payload==='SUPPORT'){
            let response = {
                'attachment': {
                  'type': 'image',
                  'payload': {
                    // 'attachment_id': "582454270331418"
                    'attachment_id': "1913534205670142"
                  }
                }
              };

            let requestBody = {
            recipient: {
                id: senderPsid
            },
            message: response
            };
            

            request({
                    'uri': 'https://graph.facebook.com/v16.0/me/message_attachments',
                    'qs': { 'access_token': PAGE_ACCESS_TOKEN },
                    'method': 'POST',
                    'json': requestBody
                  }, (err, _res, _body) => {
                    if (!err) {
                      console.log('Message sent  2222!');
                    } else {
                      console.error('Unable to send message:' + err);  
                    }
                  });

            // const qs = 'access_token=' + PAGE_ACCESS_TOKEN;
            // return fetch('https://graph.facebook.com/v16.0/me/message_attachments?' + qs, {
            // method: 'POST',
            // headers: {'Content-Type': 'application/json'},
            // body: JSON.stringify(requestBody),
            // });
        }
    }

    // Sends response messages via the Send API
    static async callSendAPI(senderPsid, response) {
        // Construct the message body
        let requestBody = {
        recipient: {
            id: senderPsid
        },
        message: response
        };
    
    //   // Send the HTTP request to the Messenger Platform
    // request({
    //     'uri': 'https://graph.facebook.com/v2.6/me/messages',
    //     'qs': { 'access_token': PAGE_ACCESS_TOKEN },
    //     'method': 'POST',
    //     'json': requestBody
    //   }, (err, _res, _body) => {
    //     if (!err) {
    //       console.log('Message sent!');
    //     } else {
    //       console.error('Unable to send message:' + err);  
    //     }
    //   });

        const qs = 'access_token=' + PAGE_ACCESS_TOKEN;
        return await fetch('https://graph.facebook.com/me/messages?' + qs, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(requestBody),
        });
    }
}