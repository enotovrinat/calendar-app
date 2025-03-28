#!/bin/bash

# Обновление системы
echo "Обновление системы..."
sudo apt update && sudo apt upgrade -y

# Установка Node.js и npm
echo "Установка Node.js и npm..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Установка MongoDB
echo "Установка MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Запуск MongoDB
echo "Запуск MongoDB..."
sudo systemctl start mongod
sudo systemctl enable mongod

# Установка PM2 для управления процессами Node.js
echo "Установка PM2..."
sudo npm install -y pm2 -g

# Создание директории для приложения
echo "Создание директории для приложения..."
sudo mkdir -p /var/www/calendar-app
sudo chown -R $USER:$USER /var/www/calendar-app

# Копирование файлов приложения
echo "Копирование файлов приложения..."
cp -r ./* /var/www/calendar-app/
cd /var/www/calendar-app

# Установка зависимостей
echo "Установка зависимостей..."
npm install

# Создание клиентской части
echo "Создание клиентской части..."
npx create-react-app client
cd client
npm install @mui/material @emotion/react @emotion/styled @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid axios react-router-dom @mui/icons-material
cd ..

# Создание файла .env
echo "Создание файла .env..."
cat > .env << EOL
MONGODB_URI=mongodb://localhost:27017/calendar-app
JWT_SECRET=$(openssl rand -base64 32)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback
PORT=5000
EOL

# Сборка клиентской части
echo "Сборка клиентской части..."
cd client
npm run build
cd ..

# Настройка PM2
echo "Настройка PM2..."
pm2 start server.js --name "calendar-app"
pm2 save
pm2 startup

# Настройка Nginx
echo "Установка и настройка Nginx..."
sudo apt install -y nginx

# Создание конфигурации Nginx
sudo tee /etc/nginx/sites-available/calendar-app << EOL
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /var/www/calendar-app/client/build;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# Активация конфигурации Nginx
sudo ln -s /etc/nginx/sites-available/calendar-app /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Настройка SSL с Certbot
echo "Установка и настройка SSL..."
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com

echo "Установка завершена!"
echo "Пожалуйста, замените 'your-domain.com' на ваш реальный домен в конфигурации Nginx и файле .env"
echo "Также не забудьте настроить Google OAuth credentials и добавить их в файл .env" 