const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для CORS и JSON
app.use(cors());
app.use(express.json());

// Моковые данные для бронирований
const mockRestaurant = {
  id: 11100,
  timezone: 'Asia/Vladivostok',
  restaurant_name: 'Супра',
  opening_time: '11:00',
  closing_time: '23:40'
};

// Массивы примеров данных (сохранены для потенциального будущего использования)
const orderStatuses = ['New', 'Bill', 'Closed', 'Banquet'];

// База данных в памяти для хранения всех элементов (заказы и бронирования)
const database = {
  orders: new Map(), // Map<date, Map<itemId, item>>
  nextOrderId: 1
};

// Пути к файлам для постоянного хранения
const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Убеждаемся, что директория данных существует
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Сохраняем базу данных в файлы
const saveDatabase = () => {
  try {
          // Преобразуем Maps в простые объекты для JSON сериализации
    const ordersData = {};
    database.orders.forEach((dateOrders, date) => {
      ordersData[date] = {};
      dateOrders.forEach((order, orderId) => {
        ordersData[date][orderId] = order;
      });
    });

          // Сохраняем в файл
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(ordersData, null, 2));
    
    console.log('Database saved to files successfully');
  } catch (error) {
    console.error('Error saving database:', error);
  }
};

// Загружаем базу данных из файлов
const loadDatabase = () => {
  try {
          // Загружаем все элементы (заказы и бронирования)
    if (fs.existsSync(ORDERS_FILE)) {
      const ordersData = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
      database.orders.clear();
      Object.entries(ordersData).forEach(([date, dateOrders]) => {
        const dateMap = new Map();
        Object.entries(dateOrders).forEach(([orderId, order]) => {
          dateMap.set(orderId, order);
        });
        database.orders.set(date, dateMap);
      });
      console.log('All items loaded from file successfully');
    }
  } catch (error) {
    console.error('Error loading database:', error);
  }
};

// Инициализируем базу данных примерами данных для сегодня
const initializeDatabase = () => {
  // Сначала пытаемся загрузить существующие данные из файлов
  loadDatabase();
  
  const today = new Date().toISOString().split('T')[0];
  
      // Если данных для сегодня нет, создаем примеры данных
    if (!database.orders.has(today) || database.orders.get(today).size === 0) {
      console.log('No existing data found, creating sample data for today...');
      
              // Примеры элементов для сегодня (заказы и бронирования объединены)
      const sampleItems = [
                  // Заказы
        { id: '29-1', status: 'New', start: '12:00', end: '19:00', customer_phone: '+79991234567', num_people: 4, customer_name: 'Иван', table_id: '10' },
        { id: '29-2', status: 'Bill', start: '13:00', end: '14:00', customer_phone: '+79998889900', num_people: 2, customer_name: 'Мария', table_id: '10' },
        { id: '29-3', status: 'Closed', start: '15:00', end: '17:00', customer_phone: '+79991112233', num_people: 3, customer_name: 'Петр', table_id: '10' },
        { id: '5-1', status: 'New', start: '11:30', end: '12:30', customer_phone: '+79987654321', num_people: 2, customer_name: 'Анна', table_id: '1' },
        { id: '5-2', status: 'Bill', start: '16:00', end: '18:00', customer_phone: '+79994445566', num_people: 5, customer_name: 'Сергей', table_id: '1' },
        { id: '6-1', status: 'Closed', start: '12:00', end: '14:00', customer_phone: '+79997778899', num_people: 6, customer_name: 'Ольга', table_id: '2' },
        { id: '20-1', status: 'New', start: '13:00', end: '15:00', customer_phone: '+79993334445', num_people: 4, customer_name: 'Дмитрий', table_id: '4' },
        { id: '21-1', status: 'Banquet', start: '18:00', end: '21:30', customer_phone: '+79996667788', num_people: 3, customer_name: 'Елена', table_id: '5' },
        { id: '21-2', status: 'New', start: '22:00', end: '23:00', customer_phone: '+79992223334', num_people: 7, customer_name: 'Алексей', table_id: '5' },
        { id: '22-1', status: 'Bill', start: '19:00', end: '21:00', customer_phone: '+79995556667', num_people: 8, customer_name: 'Наталья', table_id: '6' },
        { id: '23-1', status: 'Closed', start: '14:00', end: '16:00', customer_phone: '+79998887766', num_people: 4, customer_name: 'Михаил', table_id: '7' },
        { id: '24-1', status: 'New', start: '15:00', end: '17:00', customer_phone: '+79991112233', num_people: 5, customer_name: 'Татьяна', table_id: '8' },
        { id: '155-1', status: 'Banquet', start: '17:00', end: '22:00', customer_phone: '+79994443332', num_people: 6, customer_name: 'Андрей', table_id: '3' },
        { id: '28-1', status: 'New', start: '16:00', end: '20:00', customer_phone: '+79997776665', num_people: 10, customer_name: 'Юлия', table_id: '9' },
        { id: '28-2', status: 'Bill', start: '17:00', end: '18:30', customer_phone: '+79991234567', num_people: 4, customer_name: 'Владимир', table_id: '9' },
        { id: '30-1', status: 'Bill', start: '18:00', end: '20:00', customer_phone: '+79998889900', num_people: 2, customer_name: 'Игорь', table_id: '11' },
        { id: '191-1', status: 'Banquet', start: '19:00', end: '23:00', customer_phone: '+79991112233', num_people: 3, customer_name: 'Екатерина', table_id: '12' },
        
                  // Бронирования (теперь со статусом Reservation или LiveQueue)
        { id: '5-res-1', status: 'Reservation', start: '13:00', end: '15:00', customer_phone: '+79991234567', num_people: 4, customer_name: 'Анна', table_id: '1' },
        { id: '5-res-2', status: 'Reservation', start: '20:00', end: '22:00', customer_phone: '+79998889900', num_people: 2, customer_name: 'Сергей', table_id: '1' },
        { id: '6-res-1', status: 'Reservation', start: '14:00', end: '16:00', customer_phone: '+79991112233', num_people: 3, customer_name: 'Мария', table_id: '2' },
        { id: '20-res-1', status: 'LiveQueue', start: '14:00', end: '16:00', customer_phone: '+79987654321', num_people: 2, customer_name: 'Михаил', table_id: '4' },
        { id: '20-res-2', status: 'Reservation', start: '18:00', end: '20:00', customer_phone: '+79994445566', num_people: 5, customer_name: 'Ольга', table_id: '4' },
        { id: '21-res-1', status: 'Reservation', start: '15:00', end: '17:00', customer_phone: '+79997778899', num_people: 6, customer_name: 'Дмитрий', table_id: '5' },
        { id: '22-res-2', status: 'LiveQueue', start: '21:00', end: '22:30', customer_phone: '+79993334445', num_people: 4, customer_name: 'Алексей', table_id: '6' },
        { id: '23-res-1', status: 'Reservation', start: '16:00', end: '18:00', customer_phone: '+79996667788', num_people: 3, customer_name: 'Наталья', table_id: '7' },
        { id: '24-res-1', status: 'Reservation', start: '17:00', end: '19:00', customer_phone: '+79992223334', num_people: 7, customer_name: 'Игорь', table_id: '8' },
        { id: '155-res-1', status: 'Reservation', start: '18:00', end: '20:00', customer_phone: '+79995556667', num_people: 8, customer_name: 'Татьяна', table_id: '3' },
        { id: '28-res-1', status: 'LiveQueue', start: '12:00', end: '14:00', customer_phone: '+79998887766', num_people: 4, customer_name: 'Владимир', table_id: '9' },
        { id: '29-res-1', status: 'Reservation', start: '20:00', end: '22:00', customer_phone: '+79991112233', num_people: 5, customer_name: 'Юлия', table_id: '10' },
        { id: '30-res-1', status: 'Reservation', start: '19:00', end: '21:00', customer_phone: '+79994443332', num_people: 6, customer_name: 'Андрей', table_id: '11' },
        { id: '191-res-1', status: 'Reservation', start: '20:00', end: '23:00', customer_phone: '+79997776665', num_people: 10, customer_name: 'Екатерина', table_id: '12' }
      ];

              // Сохраняем все элементы в базе данных
      database.orders.set(today, new Map());
      
      sampleItems.forEach(item => {
        database.orders.get(today).set(item.id, item);
      });
      
              // Сохраняем примеры данных в файлы
      saveDatabase();
    } else {
      console.log('Existing data loaded from files');
    }
};

// Инициализируем базу данных при запуске сервера
initializeDatabase();

// Хардкод данные удалены - теперь используем базу данных

// POST /api/orders - Создать новый заказ
app.post('/api/orders', (req, res) => {
  try {
    const { 
      start_time, 
      end_time, 
      customer_name, 
      customer_phone, 
      num_people, 
      status, 
      tables 
    } = req.body;
    
    // Проверяем обязательные поля
    if (!start_time || !end_time || !customer_name || !customer_phone || !num_people || !tables) {
      return res.status(400).json({ 
        error: 'Missing required fields: start_time, end_time, customer_name, customer_phone, num_people, tables' 
      });
    }
    
    // Извлекаем дату из start_time для хранения
    const orderDate = start_time.split('T')[0];
    
    // Создаем заказы для каждого выбранного стола
    const createdOrders = [];
    
    tables.forEach(tableId => {
      // Генерируем уникальный ID для нового заказа
      const orderId = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
              // Извлекаем время из ISO строки
      const startTime = start_time.match(/T(\d{2}:\d{2}):\d{2}/)?.[1] || '00:00';
      const endTime = end_time.match(/T(\d{2}:\d{2}):\d{2}/)?.[1] || '00:00';
      
              // Создаем объект нового заказа
      const newOrder = {
        id: orderId,
        status: status || 'New',
        start: startTime,
        end: endTime,
        customer_name,
        customer_phone,
        num_people: parseInt(num_people),
        table_id: tableId
      };
      
              // Сохраняем новый заказ в базе данных
      if (!database.orders.has(orderDate)) {
        database.orders.set(orderDate, new Map());
      }
      database.orders.get(orderDate).set(orderId, newOrder);
      
      createdOrders.push(newOrder);
    });
    
    // Сохраняем базу данных в файлы после создания заказов
    saveDatabase();
    
    console.log('Created new orders:', createdOrders);
    
    res.status(201).json({
      success: true,
      orders: createdOrders,
      message: 'Orders created successfully'
    });
    
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/orders/:id - Удалить заказ
app.delete('/api/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    
    let orderDeleted = false;
    
    // Ищем элемент в базе данных
    for (const [date, dateItems] of database.orders) {
      if (dateItems.has(id)) {
        dateItems.delete(id);
        orderDeleted = true;
        console.log(`Deleted item ${id} from date ${date}`);
        break;
      }
    }
    
    if (!orderDeleted) {
      return res.status(404).json({ error: 'Order or reservation not found' });
    }
    
    // Сохраняем базу данных в файлы после удаления
    saveDatabase();
    
    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Базовая конфигурация столов (вынесено наружу, чтобы переиспользовать в search-endpoint).
const BASE_TABLES = [
  { id: '1', capacity: 2, number: '5', zone: '1 этаж' },
  { id: '2', capacity: 2, number: '6', zone: '1 этаж' },
  { id: '3', capacity: 6, number: '155', zone: '2 этаж' },
  { id: '4', capacity: 4, number: '20', zone: '1 этаж' },
  { id: '5', capacity: 6, number: '21', zone: '1 этаж' },
  { id: '6', capacity: 6, number: '22', zone: '1 этаж' },
  { id: '7', capacity: 6, number: '23', zone: '1 этаж' },
  { id: '8', capacity: 6, number: '24', zone: '1 этаж' },
  { id: '9', capacity: 4, number: '28', zone: '2 этаж' },
  { id: '10', capacity: 4, number: '29', zone: '2 этаж' },
  { id: '11', capacity: 6, number: '30', zone: '2 этаж' },
  { id: '12', capacity: 8, number: '191', zone: 'Банкетный зал' }
];

const TABLES_BY_ID = new Map(BASE_TABLES.map((t) => [t.id, t]));

// Item в плоском хранилище → форма Reservation, которую ждёт фронт.
const itemToReservation = (item, date) => ({
  id: item.id,
  name_for_reservation: item.customer_name,
  num_people: item.num_people,
  phone_number: item.customer_phone,
  status: item.status,
  seating_time: `${date}T${item.start}:00+10:00`,
  end_time: `${date}T${item.end}:00+10:00`
});

// Item в плоском хранилище → форма Order. LiveQueue тоже идёт сюда.
const itemToOrder = (item, date) => ({
  id: item.id,
  status: item.status,
  start_time: `${date}T${item.start}:00+00:00`,
  end_time: `${date}T${item.end}:00+00:00`,
  customer_phone: item.customer_phone,
  num_people: item.num_people,
  customer_name: item.customer_name
});

const isReservationStatus = (status) => status === 'Reservation';

const generateMockTables = (date) => {
  return BASE_TABLES.map((table) => {
    const orders = [];
    const reservations = [];

    if (database.orders.has(date)) {
      const dateItems = database.orders.get(date);
      dateItems.forEach((item) => {
        if (item.table_id !== table.id) return;
        if (isReservationStatus(item.status)) {
          reservations.push(itemToReservation(item, date));
        } else {
          orders.push(itemToOrder(item, date));
        }
      });
    }

    return { ...table, orders, reservations };
  });
};

const generateAvailableDays = () => {
  const today = new Date();
  const days = [];
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() + i);
    days.push(day.toISOString().split('T')[0]);
  }
  
  return days;
};

// Маршруты

// GET /api/reservations/:date - Получить бронирования для конкретной даты
app.get('/api/reservations/:date', (req, res) => {
  try {
    const { date } = req.params;
    
    // Проверяем формат даты
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const response = {
      available_days: generateAvailableDays(),
      current_day: date,
      restaurant: mockRestaurant,
      tables: generateMockTables(date)
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error getting reservations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Русские лейблы статусов (продублированы из frontend/src/utils/status.ts;
// синхронизировать вручную — мапа короткая).
const STATUS_LABELS_RU = {
  New: 'Новый',
  Bill: 'Пречек',
  Closed: 'Закрытый',
  Banquet: 'Банкет',
  Reservation: 'Бронирование',
  LiveQueue: 'Живая очередь'
};

const normalizePhone = (s) => (s == null ? '' : String(s).replace(/\D+/g, ''));

const itemMatchesQuery = (item, table, q) => {
  const lower = q.toLowerCase();
  const digits = normalizePhone(q);

  if ((item.customer_name || '').toLowerCase().includes(lower)) return true;
  if (digits.length > 0 && normalizePhone(item.customer_phone).includes(digits)) return true;
  if ((item.status || '').toLowerCase().includes(lower)) return true;
  if ((STATUS_LABELS_RU[item.status] || '').toLowerCase().includes(lower)) return true;
  if (String(table.number).toLowerCase().includes(lower)) return true;

  return false;
};

// GET /api/reservations/search/:query - Глобальный поиск по всем датам.
// Возвращает плоский список SearchResult; формат меняется относительно прежнего.
app.get('/api/reservations/search/:query', (req, res) => {
  try {
    const { query } = req.params;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = [];

    for (const [date, dateItems] of database.orders) {
      dateItems.forEach((item) => {
        const table = TABLES_BY_ID.get(item.table_id);
        if (!table) return;
        if (!itemMatchesQuery(item, table, query)) return;

        const isReservation = isReservationStatus(item.status);
        results.push({
          date,
          kind: isReservation ? 'reservation' : 'order',
          tableId: table.id,
          tableNumber: table.number,
          zone: table.zone,
          item: isReservation ? itemToReservation(item, date) : itemToOrder(item, date)
        });
      });
    }

    res.json({ results });
  } catch (error) {
    console.error('Error searching reservations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/restaurant - Получить информацию о ресторане
app.get('/api/restaurant', (req, res) => {
  try {
    res.json(mockRestaurant);
  } catch (error) {
    console.error('Error getting restaurant info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders - Получить все заказы для конкретной даты
app.get('/api/orders/:date', (req, res) => {
  try {
    const { date } = req.params;
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const orders = database.orders.has(date) ? Array.from(database.orders.get(date).values()) : [];
    
    res.json({
      success: true,
      date,
      orders
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reservations/:date - Получить все элементы для конкретной даты (заказы и бронирования объединены)
app.get('/api/reservations/:date', (req, res) => {
  try {
    const { date } = req.params;
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const allItems = database.orders.has(date) ? Array.from(database.orders.get(date).values()) : [];
    
    // Разделяем заказы и бронирования
    const orders = allItems.filter(item => !['Reservation', 'LiveQueue'].includes(item.status));
    const reservations = allItems.filter(item => ['Reservation', 'LiveQueue'].includes(item.status));
    
    res.json({
      success: true,
      date,
      orders,
      reservations
    });
  } catch (error) {
    console.error('Error getting items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/available-days - Получить доступные дни
app.get('/api/available-days', (req, res) => {
  try {
    res.json(generateAvailableDays());
  } catch (error) {
    console.error('Error getting available days:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Запускаем сервер
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

// Graceful shutdown - сохраняем данные перед выходом
process.on('SIGINT', () => {
  console.log('\n🔄 Shutting down gracefully...');
  saveDatabase();
  console.log('💾 Database saved successfully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔄 Shutting down gracefully...');
  saveDatabase();
  console.log('💾 Database saved successfully');
  process.exit(0);
});
