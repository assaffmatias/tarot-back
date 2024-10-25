const OpenAI = require("openai");

const OpenAIClient = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

module.exports = { OpenAIClient };
