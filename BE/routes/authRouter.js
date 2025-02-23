const router = require('express').Router();
const { googleLogin, fetchCalendarEvents, createCalendarEvent, updateProfile, fetchGmailEvents } = require('../controller/authController');
const { extractEventFromMessage } = require('../controller/geminiController');

router.get('/test', (req, res) => {
  res.send('test pass');
});
router.post('/google', googleLogin);
router.get('/calendar/events', fetchCalendarEvents);
router.post('/calendar/events', createCalendarEvent);
router.put('/update-profile', updateProfile);
router.get('/gmail/events', fetchGmailEvents);
router.post('/gemini/extract-event', extractEventFromMessage)

console.log('Routes registered:', router.stack.map(r => `${r.route.path} (${Object.keys(r.route.methods)})`));

module.exports = router;