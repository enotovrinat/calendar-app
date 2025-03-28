const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');

// Middleware для проверки JWT токена
const verifyToken = async (req, res, next) => {
  try {
    console.log('Verifying token...');
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', decoded);

    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Недействительный токен' });
  }
};

// Middleware для проверки роли администратора
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Доступ запрещен' });
  }
  next();
};

// Получение всех событий
router.get('/', verifyToken, async (req, res) => {
  try {
    console.log('Fetching events for user:', req.user.email);
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: req.user.googleAccessToken,
      refresh_token: req.user.googleRefreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const response = await calendar.events.list({
      calendarId: req.user.googleCalendarId,
      timeMin: new Date().toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime'
    });

    console.log('Events fetched successfully');
    res.json(response.data.items);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Ошибка при получении событий', error: error.message });
  }
});

// Создание нового события
router.post('/', verifyToken, async (req, res) => {
  try {
    console.log('Creating new event:', req.body);
    const { title, description, start, end } = req.body;

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: req.user.googleAccessToken,
      refresh_token: req.user.googleRefreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: title,
      description: description || '',
      start: {
        dateTime: new Date(start).toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: new Date(end).toISOString(),
        timeZone: 'UTC'
      }
    };

    const response = await calendar.events.insert({
      calendarId: req.user.googleCalendarId,
      resource: event
    });

    console.log('Event created successfully:', response.data);
    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Ошибка при создании события', error: error.message });
  }
});

// Получение события по ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    console.log('Fetching event by ID:', req.params.id);
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: req.user.googleAccessToken,
      refresh_token: req.user.googleRefreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const response = await calendar.events.get({
      calendarId: req.user.googleCalendarId,
      eventId: req.params.id
    });

    console.log('Event fetched successfully');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Ошибка при получении события', error: error.message });
  }
});

// Обновление события
router.put('/:id', verifyToken, async (req, res) => {
  try {
    console.log('Updating event:', req.params.id);
    const { title, description, start, end } = req.body;

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: req.user.googleAccessToken,
      refresh_token: req.user.googleRefreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: title,
      description: description || '',
      start: {
        dateTime: new Date(start).toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: new Date(end).toISOString(),
        timeZone: 'UTC'
      }
    };

    const response = await calendar.events.update({
      calendarId: req.user.googleCalendarId,
      eventId: req.params.id,
      resource: event
    });

    console.log('Event updated successfully');
    res.json(response.data);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Ошибка при обновлении события', error: error.message });
  }
});

// Удаление события
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    console.log('Deleting event:', req.params.id);
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: req.user.googleAccessToken,
      refresh_token: req.user.googleRefreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    await calendar.events.delete({
      calendarId: req.user.googleCalendarId,
      eventId: req.params.id
    });

    console.log('Event deleted successfully');
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Ошибка при удалении события', error: error.message });
  }
});

module.exports = router; 