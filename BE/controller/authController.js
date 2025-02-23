const { oAuth2Client, calendar } = require("../utills/googleconfig");
const UserModel = require("../models/usermodel");
const jwt = require('jsonwebtoken');

const googleLogin = async (req, res) => {
  try {
    const { code } = req.body;
    console.log('Received authorization code:', code);

    console.log('Exchanging code for tokens...');
    const { tokens } = await oAuth2Client.getToken(code);
    const accessToken = tokens.access_token;
    const idToken = tokens.id_token;
    console.log('Access token:', accessToken);
    console.log('ID token:', idToken);

    console.log('Verifying ID token...');
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    console.log('Token payload:', payload);
    const { email, name, picture, sub: googleId } = payload;

    console.log('Checking for existing user with email:', email);
    let user = await UserModel.findOne({ email });
    if (!user) {
      console.log('Creating new user...');
      user = await UserModel.create({
        name,
        email,
        password: 'GOOGLE_OAUTH',
        image: picture,
        googleAccessToken: accessToken,
      });
    } else {
      console.log('Updating existing user...');
      user.googleAccessToken = accessToken;
      await user.save();
    }
    console.log('User saved:', user);

    // Generate JWT with 1-hour expiration
    const jwtToken = jwt.sign(
      { _id: user._id, email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // 1-hour expiration
    );

    // Set cookie with 1-hour expiration
    res.cookie('authToken', jwtToken, {
      httpOnly: true, // Prevents JavaScript access to cookie
      secure: process.env.NODE_ENV === 'production', // Use secure in production
      sameSite: 'strict', // Prevents CSRF
      maxAge: 3600000, // 1 hour in milliseconds
    });

    return res.status(200).json({
      message: 'Success',
      token: jwtToken, // Still return token for Zustand if needed
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });
  } catch (err) {
    console.error('Google login error:', err);
    return res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

const fetchCalendarEvents = async (req, res) => {
  try {
    console.log('Fetching calendar events...');
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies.authToken; // Check cookie if header is missing

    let token;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (cookieToken) {
      token = cookieToken;
    } else {
      console.log('No authorization header or cookie');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded._id);

    if (!user) {
      console.log('User not found for ID:', decoded._id);
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.googleAccessToken) {
      console.log('No Google access token for user');
      return res.status(400).json({ message: 'Google access token not found' });
    }

    oAuth2Client.setCredentials({ access_token: user.googleAccessToken });

    const maxResults = req.query.maxResults ? parseInt(req.query.maxResults) : 2500;

    const response = await calendar.events.list({
      auth: oAuth2Client,
      calendarId: 'primary',
      timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      timeMax: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      maxResults: maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    return res.status(200).json({ message: 'Events fetched successfully', events });
  } catch (error) {
    console.error('Fetch calendar events error:', error);
    return res.status(500).json({ message: 'Failed to fetch events', error: error.message });
  }
};

const createCalendarEvent = async (req, res) => {
  try {
    console.log('Creating calendar event...');
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies.authToken;

    let token;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (cookieToken) {
      token = cookieToken;
    } else {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.googleAccessToken) {
      return res.status(400).json({ message: 'Google access token not found' });
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
      calendarId: 'primary',
      resource: event,
    });

    return res.status(201).json({ message: 'Event created successfully', event: response.data });
  } catch (error) {
    console.error('Create calendar event error:', error);
    return res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { userId, name, email, image } = req.body;

    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies.authToken;

    let token;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (cookieToken) {
      token = cookieToken;
    } else {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { name, email, image },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

const fetchGmailEvents = async (req, res) => {
    try {
      console.log('Fetching Gmail events...');
      const authHeader = req.headers.authorization;
      const cookieToken = req.cookies.authToken;
  
      let token;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else if (cookieToken) {
        token = cookieToken;
      } else {
        return res.status(401).json({ message: 'Unauthorized' });
      }
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await UserModel.findById(decoded._id);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      if (!user.googleAccessToken) {
        return res.status(400).json({ message: 'Google access token not found' });
      }
  
      oAuth2Client.setCredentials({ access_token: user.googleAccessToken });
  
      // Search Gmail for emails with event-related keywords
      const gmailResponse = await gmail.users.messages.list({
        auth: oAuth2Client,
        userId: 'me',
        q: 'subject:(invite OR reservation OR flight OR meeting) -is:chat',
      });
  
      const messages = gmailResponse.data.messages || [];
      const events = [];
  
      for (const message of messages) {
        const msg = await gmail.users.messages.get({
          auth: oAuth2Client,
          userId: 'me',
          id: message.id,
        });
  
        const eventData = extractEventFromEmail(msg.data);
        if (eventData) {
          events.push(eventData);
          await calendar.events.insert({
            auth: oAuth2Client,
            calendarId: 'primary',
            resource: eventData,
          });
        }
      }
  
      return res.status(200).json({ message: 'Gmail events fetched and added to calendar', events });
    } catch (error) {
      console.error('Fetch Gmail events error:', error);
      return res.status(500).json({ message: 'Failed to fetch Gmail events', error: error.message });
    }
  };
  
 
  
  // Helper function to extract event data from Gmail message
//   function extractEventFromEmail(message) {
//     try {
//       const payload = message.payload;
//       const body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
//       const subject = payload.headers.find(h => h.name === 'Subject')?.value || '';
  
//       // Simple heuristic to detect event details (e.g., date, time, location)
//       const dateMatch = body.match(/\d{1,2}[/-]\d{1,2}[/-]\d{4}\s+\d{1,2}:\d{2}/);
//       const locationMatch = body.match(/at\s+([A-Za-z\s,]+)\s*(?:,|\n)/);
  
//       if (dateMatch && subject.includes('invite' || 'reservation' || 'flight' || 'meeting')) {
//         const [dateTime] = dateMatch;
//         const location = locationMatch ? locationMatch[1] : 'N/A';
  
//         const [date, time] = dateTime.split(' ');
//         const [month, day, year] = date.split(/[/-]/);
//         const [hours, minutes] = time.split(':');
  
//         const startDateTime = new Date(year, month - 1, day, hours, minutes).toISOString();
//         const endDateTime = new Date(year, month - 1, day, hours, parseInt(minutes) + 60).toISOString(); // Assume 1-hour duration
  
//         return {
//           summary: subject,
//           description: body.substring(0, 200), // Truncate description
//           start: { dateTime: startDateTime },
//           end: { dateTime: endDateTime },
//           location,
//         };
//       }
//       return null;
//     } catch (error) {
//       console.error('Error extracting event from email:', error);
//       return null;
//     }
//   }

  module.exports = { googleLogin, fetchCalendarEvents, createCalendarEvent, updateProfile };