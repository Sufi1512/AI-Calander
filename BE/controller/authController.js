const { oAuth2Client, calendar, gmail } = require("../utills/googleconfig");
const UserModel = require("../models/usermodel");
const jwt = require("jsonwebtoken");

const googleLogin = async (req, res) => {
  try {
    const { code } = req.body;
    console.log("Received authorization code:", code);

    const { tokens } = await oAuth2Client.getToken(code);
    const accessToken = tokens.access_token;
    const idToken = tokens.id_token;

    const ticket = await oAuth2Client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    let user = await UserModel.findOne({ email });
    if (!user) {
      user = await UserModel.create({
        name,
        email,
        password: "GOOGLE_OAUTH",
        image: picture,
        googleAccessToken: accessToken,
      });
    } else {
      user.googleAccessToken = accessToken;
      await user.save();
    }

    const jwtToken = jwt.sign(
      { _id: user._id, email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("authToken", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000, // 1 hour
    });

    return res.status(200).json({
      message: "Success",
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });
  } catch (err) {
    console.error("Google login error:", err);
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

const fetchCalendarEvents = async (req, res) => {
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

    if (!user || !user.googleAccessToken) {
      return res.status(400).json({ message: "User or Google access token not found" });
    }

    oAuth2Client.setCredentials({ access_token: user.googleAccessToken });

    const maxResults = req.query.maxResults ? parseInt(req.query.maxResults) : 2500;

    const response = await calendar.events.list({
      auth: oAuth2Client,
      calendarId: "primary",
      timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      timeMax: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      maxResults: maxResults,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items || [];
    return res.status(200).json({ message: "Events fetched successfully", events });
  } catch (error) {
    console.error("Fetch calendar events error:", error);
    return res.status(500).json({ message: "Failed to fetch events", error: error.message });
  }
};

const createCalendarEvent = async (req, res) => {
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

    if (!user || !user.googleAccessToken) {
      return res.status(400).json({ message: "User or Google access token not found" });
    }

    oAuth2Client.setCredentials({ access_token: user.googleAccessToken });

    const { summary, description, start, end, location } = req.body;

    const event = {
      summary,
      description,
      start,
      end,
      location,
    };

    const response = await calendar.events.insert({
      auth: oAuth2Client,
      calendarId: "primary",
      resource: event,
    });

    return res.status(201).json({ message: "Event created successfully", event: response.data });
  } catch (error) {
    console.error("Create calendar event error:", error);
    return res.status(500).json({ message: "Failed to create event", error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { userId, name, email, image } = req.body;

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
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { name, email, image },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
};

// Helper function to extract event data from Gmail message
const extractEventFromEmail = (message) => {
  try {
    const payload = message.payload;
    const headers = payload.headers;
    const subject = headers.find((h) => h.name === "Subject")?.value || "Untitled";
    const dateHeader = headers.find((h) => h.name === "Date")?.value;

    const content = (message.snippet || "").toLowerCase() + " " + (subject || "").toLowerCase();
    const isRelevant = /meeting schedule|assessment schedule|pending task|meeting|schedule|task/i.test(content);
    if (!isRelevant) return null;

    const dateMatch = content.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})?\s*(\d{1,2}:\d{2}\s*(am|pm)?)?/i);
    let startTime;
    if (dateMatch) {
      startTime = new Date(`${dateMatch[1] || new Date().toISOString().split("T")[0]} ${dateMatch[2] || "09:00"}`);
    } else {
      startTime = dateHeader ? new Date(dateHeader) : new Date();
    }
    const startTimeISO = startTime.toISOString();
    const endTimeISO = new Date(startTime.getTime() + 60 * 60 * 1000).toISOString(); // 1-hour duration

    return {
      summary: subject,
      description: message.snippet,
      start: { dateTime: startTimeISO, timeZone: "UTC" },
      end: { dateTime: endTimeISO, timeZone: "UTC" },
    };
  } catch (error) {
    console.error("Error extracting event from email:", error);
    return null;
  }
};

// Fetch Gmail Events and Integrate into Calendar
const fetchGmailEvents = async (req, res) => {
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

    if (!user || !user.googleAccessToken) {
      return res.status(400).json({ message: "User or Google access token not found" });
    }

    oAuth2Client.setCredentials({ access_token: user.googleAccessToken });

    const gmailResponse = await gmail.users.messages.list({
      auth: oAuth2Client,
      userId: "me",
      q: "meeting schedule assessment schedule pending task meeting task",
      maxResults: 10, // Top 10 emails
    });

    const messages = gmailResponse.data.messages || [];
    const events = [];

    for (const message of messages) {
      const msg = await gmail.users.messages.get({
        auth: oAuth2Client,
        userId: "me",
        id: message.id,
      });

      const eventData = extractEventFromEmail(msg.data);
      if (eventData) {
        const existingEvents = await calendar.events.list({
          auth: oAuth2Client,
          calendarId: "primary",
          q: eventData.summary,
          timeMin: eventData.start.dateTime,
          timeMax: eventData.end.dateTime,
          singleEvents: true,
        });

        if (!existingEvents.data.items || existingEvents.data.items.length === 0) {
          const createdEvent = await calendar.events.insert({
            auth: oAuth2Client,
            calendarId: "primary",
            resource: eventData,
          });
          events.push(createdEvent.data);
        } else {
          console.log(`Event "${eventData.summary}" already exists, skipping...`);
        }
      }
    }

    return res.status(200).json({
      message: events.length > 0 ? "Gmail events fetched and added to calendar" : "No new relevant Gmail events found",
      events,
    });
  } catch (error) {
    console.error("Fetch Gmail events error:", error);
    return res.status(500).json({ message: "Failed to fetch Gmail events", error: error.message });
  }
};

module.exports = {
  googleLogin,
  fetchCalendarEvents,
  createCalendarEvent,
  updateProfile,
  fetchGmailEvents,
};