const express = require('express');
const cors = require('cors');
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

// Hardcoded orders by table number (keeps overlaps like in the UI example)
const hardcodedOrdersByTableNumber = {
  '29': [
    { id: '29-1', status: 'New', start: '12:00', end: '19:00' },
    { id: '29-2', status: 'Bill', start: '13:00', end: '14:00' },
    { id: '29-3', status: 'Closed', start: '15:00', end: '17:00' }
  ],
  '5': [
    { id: '5-1', status: 'New', start: '11:30', end: '12:30' },
    { id: '5-2', status: 'Bill', start: '16:00', end: '18:00' }
  ],
  '6': [
    { id: '6-1', status: 'Closed', start: '12:00', end: '14:00' }
  ],
  '20': [
    { id: '20-1', status: 'New', start: '13:00', end: '15:00' }
  ],
  '21': [
    { id: '21-1', status: 'Banquet', start: '18:00', end: '21:30' },
    { id: '21-2', status: 'New', start: '22:00', end: '23:00' }
  ],
  '22': [
    { id: '22-1', status: 'Bill', start: '19:00', end: '21:00' }
  ],
  '23': [
    { id: '23-1', status: 'Closed', start: '14:00', end: '16:00' }
  ],
  '24': [
    { id: '24-1', status: 'New', start: '15:00', end: '17:00' }
  ],
  '155': [
    { id: '155-1', status: 'Banquet', start: '17:00', end: '22:00' }
  ],
  '28': [
    { id: '28-1', status: 'New', start: '16:00', end: '20:00' },
    { id: '28-2', status: 'Bill', start: '17:00', end: '18:30' }
  ],
  '30': [
    { id: '30-1', status: 'Bill', start: '18:00', end: '20:00' }
  ],
  '191': [
    { id: '191-1', status: 'Banquet', start: '19:00', end: '23:00' }
  ]
};

// Hardcoded reservations by table number
const hardcodedReservationsByTableNumber = {
  '5': [
    { id: '5-res-1', name: 'Анна', people: 4, phone: '+79991234567', status: 'Новая', start: '13:00', end: '15:00' },
    { id: '5-res-2', name: 'Сергей', people: 2, phone: '+79998889900', status: 'Открыт', start: '20:00', end: '22:00' }
  ],
  '6': [
    { id: '6-res-1', name: 'Мария', people: 3, phone: '+79991112233', status: 'Заявка', start: '14:00', end: '16:00' }
  ],
  '20': [
    { id: '20-res-1', name: 'Михаил', people: 2, phone: '+79987654321', status: 'Живая очередь', start: '14:00', end: '16:00' },
    { id: '20-res-2', name: 'Ольга', people: 5, phone: '+79994445566', status: 'Новая', start: '18:00', end: '20:00' }
  ],
  '21': [
    { id: '21-res-1', name: 'Дмитрий', people: 6, phone: '+79997778899', status: 'Открыт', start: '15:00', end: '17:00' }
  ],
  '22': [
    { id: '22-res-2', name: 'Алексей', people: 4, phone: '+79993334445', status: 'Живая очередь', start: '21:00', end: '22:30' }
  ],
  '23': [
    { id: '23-res-1', name: 'Наталья', people: 3, phone: '+79996667788', status: 'Новая', start: '16:00', end: '18:00' }
  ],
  '24': [
    { id: '24-res-1', name: 'Игорь', people: 7, phone: '+79992223334', status: 'Заявка', start: '17:00', end: '19:00' }
  ],
  '155': [
    { id: '155-res-1', name: 'Татьяна', people: 8, phone: '+79995556667', status: 'Открыт', start: '18:00', end: '20:00' }
  ],
  '28': [
    { id: '28-res-1', name: 'Владимир', people: 4, phone: '+79998887766', status: 'Живая очередь', start: '15:00', end: '17:00' }
  ],
  '29': [
    { id: '29-res-1', name: 'Юлия', people: 5, phone: '+79991112233', status: 'Новая', start: '20:00', end: '22:00' }
  ],
  '30': [
    { id: '30-res-1', name: 'Андрей', people: 6, phone: '+79994443332', status: 'Заявка', start: '19:00', end: '21:00' }
  ],
  '191': [
    { id: '191-res-1', name: 'Екатерина', people: 10, phone: '+79997776665', status: 'Открыт', start: '20:00', end: '23:00' }
  ]
};

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
    
    // Use hardcoded orders for this table (no random generation)
    const orders = (hardcodedOrdersByTableNumber[table.number] || []).map((o) => ({
      id: o.id,
      status: o.status,
      start_time: `${date}T${o.start}:00+10:00`,
      end_time: `${date}T${o.end}:00+10:00`
    }));
    
    // Use hardcoded reservations for this table
    const reservations = (hardcodedReservationsByTableNumber[table.number] || []).map((r) => ({
      id: r.id,
      name_for_reservation: r.name,
      num_people: r.people,
      phone_number: r.phone,
      status: r.status,
      seating_time: `${date}T${r.start}:00+10:00`,
      end_time: `${date}T${r.end}:00+10:00`
    }));
    
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
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📅 API available at http://localhost:${PORT}/api`);
});
