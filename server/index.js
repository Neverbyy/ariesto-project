const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data for reservations
const mockRestaurant = {
  id: 11100,
  timezone: 'Asia/Vladivostok',
  restaurant_name: 'Супра',
  opening_time: '11:00',
  closing_time: '23:40'
};

// Sample data arrays (kept for potential future use)
const orderStatuses = ['New', 'Bill', 'Closed', 'Banquet'];

// In-memory database for storing all items (orders and reservations)
const database = {
  orders: new Map(), // Map<date, Map<itemId, item>>
  nextOrderId: 1
};

// File paths for persistent storage
const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Save database to files
const saveDatabase = () => {
  try {
    // Convert Maps to plain objects for JSON serialization
    const ordersData = {};
    database.orders.forEach((dateOrders, date) => {
      ordersData[date] = {};
      dateOrders.forEach((order, orderId) => {
        ordersData[date][orderId] = order;
      });
    });

    // Save to file
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(ordersData, null, 2));
    
    console.log('Database saved to files successfully');
  } catch (error) {
    console.error('Error saving database:', error);
  }
};

// Load database from files
const loadDatabase = () => {
  try {
    // Load all items (orders and reservations)
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

// Initialize database with sample data for today
const initializeDatabase = () => {
  // First, try to load existing data from files
  loadDatabase();
  
  const today = new Date().toISOString().split('T')[0];
  
      // If no data exists for today, create sample data
    if (!database.orders.has(today) || database.orders.get(today).size === 0) {
      console.log('No existing data found, creating sample data for today...');
      
      // Sample items for today (orders and reservations combined)
      const sampleItems = [
        // Orders
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
        
        // Reservations (now with status Reservation or LiveQueue)
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

      // Store all items in database
      database.orders.set(today, new Map());
      
      sampleItems.forEach(item => {
        database.orders.get(today).set(item.id, item);
      });
      
      // Save sample data to files
      saveDatabase();
    } else {
      console.log('Existing data loaded from files');
    }
};

// Initialize database on server start
initializeDatabase();

// Hardcoded data removed - now using database

// POST /api/orders - Create a new order
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
    
    // Validate required fields
    if (!start_time || !end_time || !customer_name || !customer_phone || !num_people || !tables) {
      return res.status(400).json({ 
        error: 'Missing required fields: start_time, end_time, customer_name, customer_phone, num_people, tables' 
      });
    }
    
    // Extract date from start_time for storage
    const orderDate = start_time.split('T')[0];
    
    // Create orders for each selected table
    const createdOrders = [];
    
    tables.forEach(tableId => {
      // Generate a unique ID for the new order
      const orderId = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Extract time from ISO string
      const startTime = start_time.match(/T(\d{2}:\d{2}):\d{2}/)?.[1] || '00:00';
      const endTime = end_time.match(/T(\d{2}:\d{2}):\d{2}/)?.[1] || '00:00';
      
      // Create the new order object
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
      
      // Store the new order in database
      if (!database.orders.has(orderDate)) {
        database.orders.set(orderDate, new Map());
      }
      database.orders.get(orderDate).set(orderId, newOrder);
      
      createdOrders.push(newOrder);
    });
    
    // Save database to files after creating orders
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

// DELETE /api/orders/:id - Delete an order
app.delete('/api/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    
    let orderDeleted = false;
    
    // Search for the item in database
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
    
    // Save database to files after deleting
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

const generateMockTables = (date) => {
  // Base tables configuration
  const baseTables = [
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

  return baseTables.map((table) => {
    
    // Get all items (orders and reservations) from database for this table and date
    const orders = [];
    const reservations = [];
    
    if (database.orders.has(date)) {
      const dateItems = database.orders.get(date);
      dateItems.forEach((item, itemId) => {
        if (item.table_id === table.id) {
          // Determine if it's an order or reservation based on status
          if (item.status === 'Reservation' || item.status === 'LiveQueue') {
            // This is a reservation
            reservations.push({
              id: item.id,
              name_for_reservation: item.customer_name,
              num_people: item.num_people,
              phone_number: item.customer_phone,
              status: item.status === 'LiveQueue' ? 'Живая очередь' : item.status,
              seating_time: `${date}T${item.start}:00+10:00`,
              end_time: `${date}T${item.end}:00+10:00`
            });
          } else {
            // This is an order
            orders.push({
              id: item.id,
              status: item.status,
              start_time: `${date}T${item.start}:00+10:00`,
              end_time: `${date}T${item.end}:00+10:00`,
              customer_phone: item.customer_phone,
              num_people: item.num_people,
              customer_name: item.customer_name
            });
          }
        }
      });
    }
    
    return {
      ...table,
      orders,
      reservations
    };
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

// Routes

// GET /api/reservations/:date - Get reservations for a specific date
app.get('/api/reservations/:date', (req, res) => {
  try {
    const { date } = req.params;
    
    // Validate date format
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

// GET /api/reservations/search/:query - Search reservations by name
app.get('/api/reservations/search/:query', (req, res) => {
  try {
    const { query } = req.params;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    // Generate mock data for today
    const today = new Date().toISOString().split('T')[0];
    const allTables = generateMockTables(today);
    
    // Filter tables that have reservations/orders matching the search query
    const filteredTables = allTables.filter(table => {
      const hasMatchingReservation = table.reservations.some(reservation => 
        reservation.name_for_reservation.toLowerCase().includes(query.toLowerCase())
      );
      
      const hasMatchingOrder = table.orders.some(order => 
        order.status.toLowerCase().includes(query.toLowerCase())
      );
      
      return hasMatchingReservation || hasMatchingOrder;
    });
    
    const response = {
      available_days: generateAvailableDays(),
      current_day: today,
      restaurant: mockRestaurant,
      tables: filteredTables
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error searching reservations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/restaurant - Get restaurant information
app.get('/api/restaurant', (req, res) => {
  try {
    res.json(mockRestaurant);
  } catch (error) {
    console.error('Error getting restaurant info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders - Get all orders for a specific date
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

// GET /api/reservations/:date - Get all items for a specific date (orders and reservations combined)
app.get('/api/reservations/:date', (req, res) => {
  try {
    const { date } = req.params;
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const allItems = database.orders.has(date) ? Array.from(database.orders.get(date).values()) : [];
    
    // Separate orders and reservations
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

// GET /api/available-days - Get available days
app.get('/api/available-days', (req, res) => {
  try {
    res.json(generateAvailableDays());
  } catch (error) {
    console.error('Error getting available days:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📅 API available at http://localhost:${PORT}/api`);
  console.log(`💾 Data will be saved to: ${DATA_DIR}`);
});

// Graceful shutdown - save data before exiting
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
