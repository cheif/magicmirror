# Magic mirror in JS

This is a magic-mirror app written completely in JS, all the user-config and state is saved in the ?state url-param. This means that you can set this up on your one computer and then just open the same url on a different device, and get the same data.

## Setup

We're using node.js as the backend, so a `npm install` should get you up and running, then you'll need to run `grunt` to get all jsx&es6 set up.

First you need to fix some API-keys, one for the forecast-api for weather-updates https://developer.forecast.io/

You will also need a CLIENT_ID and CLIENT_SECRET for a Google-API app with access to the https://www.googleapis.com/auth/calendar.readonly scope, you can create this at the [Developer console](https://console.developers.google.com/).

The Google app will also need to have `your-url/codeCallback` as an redirect_uri, and `your-url` as an authorized JS origin.

When you have aquried keys you should set them as env-vars, then you should be able to run this using `npm start`.

## Deployment

You can now just copy this url to the device running on your magic mirror, and everything should work, since all the conf is in the state-parameter.
