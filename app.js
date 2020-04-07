const { App } = require('@slack/bolt');
const redis = require('redis');
const redis_client = redis.createClient();
const moment = require('moment-timezone');

var items = [];
var users = {};

redis_client.on('error', (err) => { console.log(err); });

async function getUser(user_id, context) {
  if (users[user_id] === undefined) {
    // get the user from the Slack api
    console.log(`Need to look up ${user_id} from the API`);
    const user = await app.client.users.info({ token: context.botToken, user: user_id, include_locale: true });
    // console.log(`display_name_normalized: ${profile.profile.display_name_normalized}`)
    users[user_id] = {
      real_name_normalized: user.user.profile.real_name_normalized,
      display_name_normalized: user.user.profile.display_name_normalized,
      image_32: user.user.profile.image_32,
      tz_offset: user.user.tz_offset,
      tz: user.user.tz,
      tz_label: user.user.tz_label
    }
  }

  return users[user_id];
}

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

app.shortcut('message_to_timeline', async ({ shortcut, ack, context, client }) => {
  try {
    // Acknowledge shortcut request
    await ack();

    const permalink = await app.client.chat.getPermalink({ token: context.botToken, channel: shortcut.channel.id, message_ts: shortcut.message.ts });

    // Remove non-stable fields so redis' SET will dedupe properly
    shortcut.action_ts = undefined;
    shortcut.response_url = undefined;
    let trigger_id = shortcut.trigger_id;
    shortcut.trigger_id = undefined;

    // Add to redis
    redis_client.zadd('timeline', parseInt(shortcut.message.ts), JSON.stringify({ permalink: permalink.permalink, shortcut: shortcut }));

    // put trigger_id back
    shortcut.trigger_id = trigger_id;

    redis_client.zrange('timeline', 0, -1, async (err, list) => {
      if (err) throw err;

      let messages = [];
      for (let i = 0; i < list.length; i++) {
        json = JSON.parse(list[i]);

        // const local_hour = (Date.UTC() + context.tz_offset).getHours();
        if (json.shortcut.message.user !== undefined) {
          const user = await getUser(json.shortcut.message.user, context);
          const ts = parseInt(json.shortcut.message.ts) * 1000;
          const m = moment(ts);
          const dF = 'YYYY-MM-DD ha z';
          messages.push(`* [#${json.shortcut.channel.name}] ${user.display_name_normalized} (${m.tz(user.tz).format(dF)}): ${json.shortcut.message.text}`);
        }
      }

      // Call the views.open method using one of the built-in WebClients
      const result = await client.views.open({
        // The token you used to initialize your app is stored in the `context` object
        token: context.botToken,
        trigger_id: shortcut.trigger_id,
        view: {
          type: "modal",
          title: { type: "plain_text", text: "Timeline" },
          close: { type: "plain_text", text: "Close" },
          blocks: [{
            type: "section",
            text: {
              type: "mrkdwn",
              //text: "About the simplest modal you could conceive of :smile:\n\nMaybe <https://api.slack.com/reference/block-kit/interactive-components|*make the modal interactive*> or <https://api.slack.com/surfaces/modals/using#modifying|*learn more advanced modal use cases*>."
              text: `Items:\n\n ${messages.join("\n")}`
            }
          }]
        }
      });

      // if you need to debug the call to Slack for the pop up
      // console.log(result);
    });
  } catch (error) {
    console.error(error);
  }
});


(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();


/*
Example messages
{
  permalink: 'https://lumosity.slack.com/archives/DQ4BU6ES0/p1585908682000400',
  shortcut: {
    type: 'message_action',
    token: 'pTS3cyJc5pbf3L8VMySKyqRq',
    action_ts: '1585930971.741381',
    team: { id: 'T02543QA4', domain: 'lumosity' },
    user: {
      id: 'UPS2CLHA6',
      name: 'erik.kastner',
      username: 'erik.kastner',
      team_id: 'T02543QA4'
    },
    channel: { id: 'DQ4BU6ES0', name: 'directmessage' },
    callback_id: 'message_to_timeline',
    trigger_id: '1046136292965.2174126344.77501c33c16bbfa51196747eb9395203',
    message_ts: '1585908682.000400',
    message: {
      client_msg_id: '51FC4D69-1544-4618-912F-AF2016794011',
      type: 'message',
      text: 'ball of jelly beans <https://vm.tiktok.com/t6U533/|https://vm.tiktok.com/t6U533/>',
      user: 'UPS2CLHA6',
      ts: '1585908682.000400',
      team: 'T02543QA4',
      attachments: [Array],
      blocks: [Array]
    },
    response_url: 'https://hooks.slack.com/app/T02543QA4/1046136293269/NnypOVuSQKGBFjIx6WWicVnv'
  }
},
{
  permalink: 'https://lumosity.slack.com/archives/DQ4BU6ES0/p1585908682000400',
  shortcut: {
    type: 'message_action',
    token: 'pTS3cyJc5pbf3L8VMySKyqRq',
    action_ts: '1585930623.195848',
    team: { id: 'T02543QA4', domain: 'lumosity' },
    user: {
      id: 'UPS2CLHA6',
      name: 'erik.kastner',
      username: 'erik.kastner',
      team_id: 'T02543QA4'
    },
    channel: { id: 'DQ4BU6ES0', name: 'directmessage' },
    callback_id: 'message_to_timeline',
    trigger_id: '1047414933460.2174126344.aac310e9c023d01ac32096df78bbf5a7',
    message_ts: '1585908682.000400',
    message: {
      client_msg_id: '51FC4D69-1544-4618-912F-AF2016794011',
      type: 'message',
      text: 'ball of jelly beans <https://vm.tiktok.com/t6U533/|https://vm.tiktok.com/t6U533/>',
      user: 'UPS2CLHA6',
      ts: '1585908682.000400',
      team: 'T02543QA4',
      attachments: [Array],
      blocks: [Array]
    },
    response_url: 'https://hooks.slack.com/app/T02543QA4/1047414934196/5x1solyd5vxGeUY9mXyjtEHY'
  }
}

*/
