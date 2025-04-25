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

client.on("connect", () => {
  console.log("✅ Connected to HiveMQ");

  client.subscribe("eastmen/+", (err) => {
    if (!err) console.log("✅ Subscribed to 'eastmen/+'");
  });
});

client.on("message", async (topic, messageBuffer) => {
  if (topic.startsWith("eastmen/")) {
    const id = topic.split("/")[1];
    console.log(`topic: ${topic}, id: ${id}`);
    try {
      const response = await axios.post(`${process.env.EASTMEN_SERVER_LINK}/api/eastmen/${id}`, {});
      console.log("✅ POST successful:", response.data);
    } catch (error) {
      console.error("❌ Error in POST:", error.response?.data || error.message);
    }
  }
});

// Start Express
const PORT = process.env.PORT || 6069;
app.listen(PORT, () => { console.log(`🚀 Express server running on port ${PORT}`) });