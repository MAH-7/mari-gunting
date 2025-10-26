// Usage: node scripts/sendSilentPing.js <expoPushToken>
// Sends a silent push via Expo to wake partner app

const fetch = require('node-fetch');

async function send(token) {
  const messages = [
    {
      to: token,
      data: { type: 'heartbeat-ping' },
      sound: null,
      body: undefined,
      title: undefined,
      priority: 'default',
      contentAvailable: true, // iOS background
      mutableContent: false,
    },
  ];

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(messages),
  });
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}

const token = process.argv[2];
if (!token) {
  console.error('Provide Expo push token: node scripts/sendSilentPing.js <token>');
  process.exit(1);
}

send(token).catch((e) => {
  console.error(e);
  process.exit(1);
});
