const { Client } = require("@octoai/client");
const requestIP = require("request-ip");

const { OCTO_AI_KEY, CLOUDFLARE_SK } = require("../utils/keys");
const User = require("../models/user");

const client = new Client(OCTO_AI_KEY);

const MAX_LIMIT_PER_PROMPT = 0;
const MAX_LIMIT_PROMPT = 0;

const verifyCloudflare = async (token) => {
  let formData = new FormData();
  console.log(CLOUDFLARE_SK);
  formData.append("secret", CLOUDFLARE_SK);
  formData.append("response", token);
  const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
  const result = await fetch(url, {
    body: formData,
    method: "POST",
  });

  const outcome = await result.json();

  console.log(outcome);
  return outcome.success;
};

const getPromptFromSlug = async (slug) => {
  const response = await fetch(
    `https://api.gravitywrite.com/api/singlePrompt/details?slug=${slug}`,
    {
      method: "GET",
      headers: {
        app: "MTIzfFdsZnJvbnRlbmR3ZWI=",
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();
  console.log(data.data.prompt.prompt);

  return data.data.prompt.prompt;
};

const attachAnswerToPrompt = (prompt, answers, tone, language) => {
  answers.forEach((answer, index) => {
    prompt = prompt.replace(`{{${answer.shortCode}}}`, answer.answer);
  });

  prompt = prompt.replace("{{tone}}", tone);
  prompt = prompt.replace("{{language}}", language);

  prompt += ` Language should be ${language}.`;
  prompt += ` Tone should be ${tone}.`;
  prompt += "Don't add image in your response.";

  return prompt;
};

const configureChat = (promptWithAnswers) => ({
  messages: [
    {
      role: "system",
      content:
        "Your a helpful assistant. Provide your response in Markdown format",
    },
    {
      role: "user",
      content: promptWithAnswers,
    },
  ],
  model: "mistral-7b-instruct-fp16",
  stream: true,
});

const processPrompt = async (req, res) => {
  const { slug, answers, tone, language, cloudflareToken } = req.body;

  const userIP = requestIP.getClientIp(req);
  const existingUserIP = await User.findOne({ userIP });

  // if (existingUserIP?.usedTools.length >= MAX_LIMIT_PROMPT) {
  if (true) {
    return res.status(402).send("LimitExceeded");
  }
  const usedToolIndex = existingUserIP?.usedTools.findIndex(
    (tool) => tool.slug === slug
  );
  const usedToolPrompt = existingUserIP?.usedTools[usedToolIndex];
  const isUsedTool = usedToolIndex !== -1;

  if (isUsedTool) {
    if (usedToolPrompt?.noOfResponse >= MAX_LIMIT_PER_PROMPT) {
      return res.status(402).send("LimitExceeded");
    }
  }

  const isCloudflareVerified = await verifyCloudflare(cloudflareToken);
  if (!isCloudflareVerified) {
    return res.status(402).send("CloudflareVerificationFailed");
  }

  const prompt = await getPromptFromSlug(slug);
  const promptWithAnswers = attachAnswerToPrompt(
    prompt,
    answers,
    tone || "friendly",
    language || "English"
  );

  console.log(promptWithAnswers);
  const chatConfig = configureChat(promptWithAnswers);
  const responseStream = await client.chat.completions.create(chatConfig);

  for await (const chunk of responseStream) {
    const chunkText = chunk.choices[0].delta.content || "";
    res.write(chunkText);
  }

  if (!existingUserIP) {
    const newUser = await User.create({
      userIP,
      usedTools: [{ slug, noOfResponse: 1 }],
    });
    await newUser.save();
  }

  if (existingUserIP && !isUsedTool) {
    const usedTools = existingUserIP.usedTools;
    usedTools.push({ slug, noOfResponse: 1 });
    await User.findByIdAndUpdate(
      existingUserIP._id,
      {
        ...existingUserIP,
        usedTools,
      },
      {
        new: true,
      }
    );
  }

  if (existingUserIP && isUsedTool) {
    const usedTools = existingUserIP.usedTools;
    usedTools[usedToolIndex].noOfResponse += 1;
    console.log(usedTools);
    await User.findByIdAndUpdate(
      existingUserIP._id,
      {
        ...existingUserIP,
        usedTools,
      },
      {
        new: true,
      }
    );
  }

  res.end();
};

module.exports = {
  processPrompt,
};
