require('dotenv').config();
const express = require('express');
const mqtt = require('mqtt');
const axios = require('axios');
const app = express();

// MQTT Options
const mqttOptions = {
  host: process.env.MQTT_HOST,
  port: 8883,
  protocol: 'mqtts',
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASS
};
const client = mqtt.connect(mqttOptions);

const orgServerMap = {
  "eastmen": process.env.EASTMEN_SERVER_LINK,
  "etp": process.env.JBR_SERVER_LINK,
};

client.on("connect", () => {
  console.log("✅ Connected to HiveMQ");
  client.subscribe("+/+", (err) => {
    if (!err) console.log("✅ Subscribed to all topics");
    else console.error("❌ Subscription error:", err);
  });
});

client.on("message", async (topic, messageBuffer) => {
  const [org, deviceId] = topic.split("/");
  const messageStr = messageBuffer.toString();
  const payload = JSON.parse(messageStr);
  const baseUrl = orgServerMap[org.toLowerCase()];
  if (!baseUrl) {
    console.warn(`⚠️ No server URL configured for org: ${org}`);
    return;
  }
  const url = `${baseUrl}/${deviceId}`;
  console.log(`➡️ Forwarding to ${url} with payload:`, payload);
  try {
    const response = await axios.post(url, payload);
    console.log("✅ POST successful:", response.data);
  } catch (error) {
    console.error("❌ Error in POST:", error.response?.data || error.message);
  }
});

app.get("/", (req, res) => { res.status(200).json({ "msg": "Done" }) });

const PORT = process.env.PORT || 6069;
app.listen(PORT, () => { console.log(`🚀 Express server running on port ${PORT}`) });
