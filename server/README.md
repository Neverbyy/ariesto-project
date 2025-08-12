# Ariesto Server

Express сервер для системы бронирования ресторана Ariesto.

## Установка

```bash
npm install
```

## Запуск

### Разработка
```bash
npm run dev
```

### Продакшн
```bash
npm start
```

## API Endpoints

### 1. Получение бронирований по дате
```
GET /api/reservations/:date
```

**Параметры:**
- `date` - дата в формате YYYY-MM-DD

**Пример:**
```bash
GET /api/reservations/2025-01-15
```

**Ответ:**
```json
{
  "available_days": ["2025-01-15", "2025-01-16", ...],
  "current_day": "2025-01-15",
  "restaurant": {
    "id": 11100,
    "timezone": "Asia/Vladivostok",
    "restaurant_name": "Супра",
    "opening_time": "11:00",
    "closing_time": "23:40"
  },
  "tables": [...]
}
```

### 2. Поиск бронирований
```
GET /api/reservations/search/:query
```

**Параметры:**
- `query` - поисковый запрос

**Пример:**
```bash
GET /api/reservations/search/Алина
```

### 3. Информация о ресторане
```
GET /api/restaurant
```

**Ответ:**
```json
{
  "id": 11100,
  "timezone": "Asia/Vladivistok",
  "restaurant_name": "Супра",
  "opening_time": "11:00",
  "closing_time": "23:40"
}
```

### 4. Доступные дни
```
GET /api/available-days
```

**Ответ:**
```json
["2025-01-15", "2025-01-16", "2025-01-17", ...]
```

### 5. Проверка здоровья сервера
```
GET /health
```

**Ответ:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

## Структура данных

### Стол (Table)
```json
{
  "id": "string",
  "capacity": "number",
  "number": "string",
  "zone": "string",
  "orders": [...],
  "reservations": [...]
}
```

### Заказ (Order)
```json
{
  "id": "string",
  "status": "string",
  "start_time": "string (ISO 8601)",
  "end_time": "string (ISO 8601)"
}
```

### Бронирование (Reservation)
```json
{
  "id": "number",
  "name_for_reservation": "string",
  "num_people": "number",
  "phone_number": "string",
  "status": "string",
  "seating_time": "string (ISO 8601)",
  "end_time": "string (ISO 8601)"
}
```

## Статусы

### Заказы
- `New` - Новый заказ
- `Bill` - Счет выписан
- `Closed` - Заказ закрыт
- `Banquet` - Банкет

### Бронирования
- `Новая` - Новое бронирование
- `Живая очередь` - В живой очереди
- `Заявка` - Заявка на бронирование
- `Открыт` - Стол открыт
- `Закрыт` - Стол закрыт

## Зоны

- `1 этаж` - Первый этаж
- `2 этаж` - Второй этаж
- `Банкетный зал` - Банкетный зал

## Порты

По умолчанию сервер запускается на порту 3000. Можно изменить через переменную окружения `PORT`.

## CORS

Сервер настроен для работы с фронтендом на localhost:5173 (Vite dev server).

