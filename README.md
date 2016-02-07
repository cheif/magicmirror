# Magic mirror in JS

This is a magic-mirror app written completely in JS, all the config and state is saved in the ?state url-param, so it should be easy to run of github.

## Setup

First you need to fix some API-keys, one for the forecast-api for weather-updates https://developer.forecast.io/

You will also need a CLIENT_ID and CLIENT_SECRET for a Google-API app with access to the https://www.googleapis.com/auth/calendar.readonly scope, you can create this at the [Developer console](https://console.developers.google.com/).

The Google app will also need to have https://cheif.github.io/magicmirror.js/ as an redirect_uri, and http://cheif.github.io as an authorized JS origin, or some other uri:s if you plan on hosting this yourself.

When you have aquried keys you should visit https://cheif.github.io/magicmirror.js/, you can enter your credentials there, and then you can add a google-user by appending &addUser to the url, you will then authorize read-access to the google application.

Another user can also be added to have multiple calendars shown, just add &addUser to the url again, and authorize with another account.

## Deployment

You can now just copy this url to the device running on your magic mirror, and everything should work, since all the conf is in the state-parameter.
