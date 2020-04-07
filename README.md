Timeliner
---------

Hi.

Post-mortems are great! One of the more tedious parts is getting together the timeline.
This small project adds a Slack message action to quickly add things to a time-ordered list to
make it easier to get together what happened when.


Demonstration
=============

Ask Erik for the movie


Developing
==========

* Run redis locally
* Try `npm install`. I haven't tested it yet... TBD
* Use `ngrok http 3000` and copy your ngrok url.
* Make a [new app](https://api.slack.com/start/overview#creating) in Slack, and go to these pages for the app
* Features / **Interactivity & Shortcuts** page
    * Under **Interactivity** put your ngrok url plus `/slack/events`. I.e.: `https://1701ee7a.ngrok.io/slack/events`
    * Create New Shortcut having a callback of `message_to_timeline` (name it whatever you'd like, this will show up in slack's message context menu)
* Features / **OAuth & Permissions** page:
    * copy `Bot User OAuth Access Token` - this will be `SLACK_BOT_TOKEN`
    * needed **Scopes**:
        1. `commands` (this may be there already)
        2. `user.profile:read` (needed to get user names)
* Settings / **Install App** into your workspace
* Copy `SLACK_SIGNING_SECRET` and `SLACK_BOT_TOKEN` from your app page
* `npx nodemon app.js`



References
==========

* [Etsy Facilitation Guide](https://extfiles.etsy.com/DebriefingFacilitationGuide.pdf)
* [Code as Craft post](https://codeascraft.com/2016/11/17/debriefing-facilitation-guide/)