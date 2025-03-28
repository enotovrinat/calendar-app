# Инструкции по развертыванию на TimeWeb (Ubuntu 22.04)

## Подготовка к развертыванию

1. Создайте новый сервер на TimeWeb с Ubuntu 22.04
2. Подключитесь к серверу через SSH
3. Убедитесь, что у вас есть права sudo

## Шаги по развертыванию

1. Загрузите файлы проекта на сервер:
```bash
# Создайте директорию для проекта
mkdir -p ~/calendar-app
cd ~/calendar-app

# Загрузите файлы проекта (замените URL на ваш репозиторий)
git clone [URL вашего репозитория] .
```

2. Сделайте скрипт установки исполняемым:
```bash
chmod +x install.sh
```

3. Запустите скрипт установки:
```bash
./install.sh
```

4. После завершения установки, отредактируйте файл `.env`:
```bash
nano /var/www/calendar-app/.env
```

Замените следующие значения:
- `your-domain.com` на ваш реальный домен
- `your_google_client_id` на ID клиента Google OAuth
- `your_google_client_secret` на секрет клиента Google OAuth

5. Настройте Google OAuth:
   - Перейдите в [Google Cloud Console](https://console.cloud.google.com)
   - Создайте новый проект
   - Включите Google Calendar API
   - Создайте учетные данные OAuth 2.0
   - Добавьте разрешенные URI перенаправления:
     ```
     https://your-domain.com/api/auth/google/callback
     ```

6. Перезапустите приложение:
```bash
cd /var/www/calendar-app
pm2 restart calendar-app
```

## Проверка работоспособности

1. Откройте ваш домен в браузере
2. Проверьте, что сайт загружается
3. Попробуйте зарегистрировать нового пользователя
4. Проверьте работу календаря
5. Проверьте интеграцию с Google Calendar

## Обслуживание

### Обновление приложения
```bash
cd /var/www/calendar-app
git pull
npm install
cd client
npm install
npm run build
cd ..
pm2 restart calendar-app
```

### Просмотр логов
```bash
pm2 logs calendar-app
```

### Мониторинг
```bash
pm2 monit
```

## Безопасность

1. Регулярно обновляйте систему:
```bash
sudo apt update && sudo apt upgrade -y
```

2. Проверяйте логи на наличие подозрительной активности:
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

3. Настройте файрвол:
```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Устранение неполадок

1. Проверка статуса сервисов:
```bash
sudo systemctl status nginx
sudo systemctl status mongod
pm2 status
```

2. Проверка логов:
```bash
sudo tail -f /var/log/nginx/error.log
pm2 logs calendar-app
```

3. Проверка конфигурации Nginx:
```bash
sudo nginx -t
``` 