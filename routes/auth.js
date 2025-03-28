const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { google } = require('googleapis');

// Регистрация пользователя
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    // Проверяем, существует ли пользователь
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    // Создаем нового пользователя
    const user = new User({
      email,
      password,
      role: role || 'user'
    });

    await user.save();

    // Создаем JWT токен
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при регистрации', error: error.message });
  }
});

// Вход пользователя
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Находим пользователя
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    // Проверяем пароль
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    // Создаем JWT токен
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при входе', error: error.message });
  }
});

// Интеграция с Google Calendar
router.get('/google', (req, res) => {
    try {
        console.log('Starting Google auth process');
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        const scopes = [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
            'openid'
        ];

        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            include_granted_scopes: true
        });

        console.log('Generated auth URL:', url);
        res.redirect(url);
    } catch (error) {
        console.error('Error in Google auth:', error);
        res.status(500).json({ message: 'Ошибка при авторизации через Google', error: error.message });
    }
});

// Callback для Google OAuth
router.get('/google/callback', async (req, res) => {
    try {
        console.log('Received callback from Google');
        const { code } = req.query;
        
        if (!code) {
            throw new Error('No code provided');
        }

        console.log('Received authorization code:', code);

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        const { tokens } = await oauth2Client.getToken(code);
        console.log('Received tokens:', tokens);

        oauth2Client.setCredentials(tokens);

        // Получаем информацию о пользователе через Google OAuth2 API
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        console.log('User info:', userInfo.data);

        const email = userInfo.data.email;
        console.log('User email:', email);

        // Создаем или обновляем пользователя
        let user = await User.findOne({ email });
        if (!user) {
            console.log('Creating new user');
            user = new User({
                email,
                googleCalendarId: 'primary',
                googleAccessToken: tokens.access_token,
                googleRefreshToken: tokens.refresh_token
            });
            await user.save();
        } else {
            console.log('Updating existing user');
            user.googleAccessToken = tokens.access_token;
            if (tokens.refresh_token) {
                user.googleRefreshToken = tokens.refresh_token;
            }
            await user.save();
        }
        console.log('User saved:', user.email);

        // Создаем JWT токен
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Перенаправляем на главную страницу с токеном
        res.redirect(`/?token=${token}`);
    } catch (error) {
        console.error('Error in Google callback:', error);
        res.status(500).json({ message: 'Ошибка при обработке Google callback', error: error.message });
    }
});

module.exports = router; 