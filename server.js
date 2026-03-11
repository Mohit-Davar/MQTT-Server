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
  "count": process.env.EASTMEN_SERVER_LINK,
  "etp": process.env.JBR_SERVER_LINK,
  "expocount": process.env.EXPOCOUNT_SERVER_LINK,
  "expoliquid": process.env.EXPOLIQUID_SERVER_LINK,
};

client.on("connect", () => {
  console.log("✅ Connected to HiveMQ");
  client.subscribe(["+/+", "data/+/+"], (err) => {
    if (!err) console.log("✅ Subscribed to topics");
    else console.error("❌ Subscription error:", err);
  });
});

client.on("message", async (topic, messageBuffer) => {
  try {
    const messageStr = messageBuffer.toString();
    const payload = JSON.parse(messageStr);
    const parts = topic.split("/");

    let url;
    if (parts.length === 3 && parts[0] === "data") {
      url = process.env.SERVER;
    } 
    else if (parts.length === 2) {
      const [org, deviceId] = parts;
      const baseUrl = orgServerMap[org?.toLowerCase()];
      if (!baseUrl) {
        console.warn(`⚠️ No server URL configured for organization: ${org}`);
        return;
      }
      url = `${baseUrl}/${deviceId}`;
    } else {
      console.warn(`⚠️ Unexpected topic format: ${topic}`);
      return;
    }

    console.log(`➡️ Forwarding to ${url} with payload:`, payload);
    const response = await axios.post(url, payload);
    console.log("✅ POST successful:", response.data);
  } catch (error) {
    console.error("❌ Error processing message:", error.message);
  }
});

app.get("/", (req, res) => { res.status(200).json({ "msg": "Done" }) });

const PORT = process.env.PORT || 6069;
app.listen(PORT, () => { console.log(`🚀 Express server running on port ${PORT}`) });
