// routes/authRouter.js
const router = require('express').Router();
const { googleLogin, fetchCalendarEvents, createCalendarEvent, updateProfile } = require('../controller/authController');

router.get('/test', (req, res) => {
  res.send('test pass');
});
router.post('/google', googleLogin);
router.get('/calendar/events', fetchCalendarEvents);
router.post('/calendar/events', createCalendarEvent); // New endpoint
router.put('/update-profile', updateProfile);

console.log('Routes registered:', router.stack.map(r => `${r.route.path} (${Object.keys(r.route.methods)})`));

module.exports = router;