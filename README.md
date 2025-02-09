
# SmartFridge: QR Control & IoT Sync

#### Команда: MLO-1 | DENVOT DAY
## Краткое описание

Проект "Умный холодильник" позволяет отслеживать содержимое холодильника, добавлять и удалять продукты с помощью QR-кодов, получать уведомления о сроках годности, вести список покупок и просматривать аналитику потребления.

## Ссылка на сервис
[fridge.tubik-corp.ru](https://fridge.tubik-corp.ru/)

## Инструкция по установке/развертыванию

1. Клонируйте репозиторий
```
git clone https://github.com/TUBIK-corp/Tubik-Fridge-public
cd Tubik-Fridge-public
```

2. Разверните приложение:
   
a) Откройте docker-compose.yml:

a.1 Замените значения на:
```
services:
  frontend:
    build: ./react-frontend
    ports:
      - "24009:24009"
```
a.2 Запустите:
```
sudo docker compose up frontend -d
```

ИЛИ 

b) Откройте папку фронтенда, установите зависимости и запустите приложение:
```
cd react-frontend
npm install
npm run dev
```

## Ссылка на видеоролик:
[Видео на Rutube](https://rutube.ru/video/private/b2133a893b1e3b2828f30b8e8a7ad17b/?p=JccJZUNcXn3nEzcnXV0ytA)

