# Календарь с интеграцией Google Calendar

Веб-приложение для управления событиями с использованием Google Calendar API.

## Требования

- Node.js (версия 14 или выше)
- MongoDB
- PM2 (для продакшн-окружения)
- Доступ к Google Cloud Console

## Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/your-username/calendar-app.git
cd calendar-app
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env` в корневой директории проекта и заполните его следующими данными:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/calendar-app
JWT_SECRET=your_super_secret_key_change_this
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

4. Настройте проект в Google Cloud Console:
   - Перейдите в [Google Cloud Console](https://console.cloud.google.com)
   - Создайте новый проект или выберите существующий
   - Включите Google Calendar API
   - Создайте учетные данные OAuth 2.0
   - Добавьте разрешенные URI перенаправления
   - Скопируйте Client ID и Client Secret в файл `.env`

## Структура проекта

```
calendar-app/
├── models/
│   └── User.js
├── public/
│   ├── index.html
│   └── styles.css
├── routes/
│   ├── auth.js
│   └── events.js
├── .env
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## Запуск

### Разработка

```bash
npm run dev
```

### Продакшн

1. Установите PM2 глобально:
```bash
npm install -g pm2
```

2. Запустите приложение через PM2:
```bash
pm2 start server.js --name calendar-app
```

3. Настройте автозапуск:
```bash
pm2 startup
pm2 save
```

## Настройка сервера

### Установка Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Установка MongoDB
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Настройка Nginx (опционально)
```bash
sudo apt-get install nginx
```

Создайте конфигурацию для вашего приложения:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL с Certbot (опционально)
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Мониторинг

### Просмотр логов
```bash
pm2 logs calendar-app
```

### Статус приложения
```bash
pm2 status
```

### Мониторинг в реальном времени
```bash
pm2 monit
```

## Обновление приложения

1. Остановите текущий процесс:
```bash
pm2 stop calendar-app
```

2. Получите последние изменения:
```bash
git pull origin main
```

3. Установите новые зависимости:
```bash
npm install
```

4. Перезапустите приложение:
```bash
pm2 restart calendar-app --update-env
```

## Лицензия

MIT 