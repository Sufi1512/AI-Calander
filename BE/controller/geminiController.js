const jwt = require("jsonwebtoken");
const UserModel = require("../models/usermodel");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

const extractEventFromMessage = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies.authToken;

    let token;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (cookieToken) {
      token = cookieToken;
    } else {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const defaultTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const chatSession = model.startChat({ generationConfig, history: [] });
    const prompt = `Extract event details from this message and return them in JSON format with fields: title, description, startTime (ISO format, e.g., "2025-02-22T16:00:00"), endTime (ISO format), location, priority (low/medium/high), type (meeting/task/reminder/other), timeZone (e.g., "Asia/Kolkata"). If a field is missing, use reasonable defaults (use "${defaultTimeZone}" for timeZone if not specified):\n\n${message}`;

    const result = await chatSession.sendMessage(prompt);
    const responseText = result.response.text();

    const cleanedResponse = responseText.replace(/```json\n|\n```/g, '').trim();
    const extractedData = JSON.parse(cleanedResponse);

    return res.status(200).json({
      message: "Event details extracted successfully",
      event: {
        title: extractedData.title || "Untitled Event",
        description: extractedData.description || "",
        startTime: extractedData.startTime || new Date().toISOString(),
        endTime: extractedData.endTime || new Date(Date.now() + 3600000).toISOString(),
        location: extractedData.location || "",
        priority: extractedData.priority || "medium",
        type: extractedData.type || "meeting",
        timeZone: extractedData.timeZone || defaultTimeZone,
      },
    });
  } catch (error) {
    console.error("Extract event from message error:", error);
    return res.status(500).json({ message: "Failed to extract event details", error: error.message });
  }
};

module.exports = {
  extractEventFromMessage,
};