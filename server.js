// Загрузка переменных окружения
require('dotenv').config();

// Импорты
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Инициализация Express приложения
const app = express();

// Импорты маршрутов
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Маршруты API
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Что-то пошло не так!', error: err.message });
});

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 