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

// Helper function to generate random data based on date
const generateRandomData = (date, seed) => {
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayOfMonth = dateObj.getDate();
  
  // Create a deterministic seed based on date
  const dateSeed = dayOfWeek * 31 + dayOfMonth;
  const random = (min, max) => {
    const x = Math.sin(dateSeed + seed) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };
  
  return { random, dayOfWeek, dayOfMonth };
};

// Sample data arrays
const customerNames = ['Анна', 'Михаил', 'Елена', 'Дмитрий', 'Ольга', 'Сергей', 'Мария', 'Алексей', 'Наталья', 'Игорь', 'Татьяна', 'Владимир', 'Юлия', 'Андрей', 'Екатерина'];
const phoneNumbers = ['+79991234567', '+79987654321', '+79995556677', '+79998889900', '+79991112233', '+79994445566', '+79997778899'];
const orderStatuses = ['New', 'Bill', 'Closed', 'Banquet'];
const reservationStatuses = ['Живая очередь', 'Новая', 'Заявка', 'Открыт', 'Закрыт'];
const timeSlots = ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'];

const generateMockTables = (date) => {
  const { random, dayOfWeek, dayOfMonth } = generateRandomData(date, 0);
  
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

  return baseTables.map((table, index) => {
    const tableSeed = index * 100;
    const { random: tableRandom } = generateRandomData(date, tableSeed);
    
    // Track used time slots to avoid conflicts
    const usedTimeSlots = new Set();
    
    // Generate orders for this table
    const orders = [];
    const orderCount = tableRandom(0, 3); // 0-3 orders per table
    const availableTimeSlots = [...timeSlots];
    
    for (let i = 0; i < orderCount && availableTimeSlots.length > 0; i++) {
      // Find an available time slot
      const randomIndex = tableRandom(0, availableTimeSlots.length - 1);
      const startTime = availableTimeSlots[randomIndex];
      const startTimeIndex = timeSlots.indexOf(startTime);
      
      // Remove used time slot from available slots
      availableTimeSlots.splice(randomIndex, 1);
      usedTimeSlots.add(startTime);
      
      // Calculate end time (ensure it doesn't exceed timeSlots bounds)
      const durationSlots = tableRandom(1, Math.min(3, timeSlots.length - startTimeIndex - 1));
      const endTimeIndex = Math.min(startTimeIndex + durationSlots, timeSlots.length - 1);
      const endTime = timeSlots[endTimeIndex];
      
      orders.push({
        id: `${table.id}-order-${i + 1}`,
        status: orderStatuses[tableRandom(0, orderStatuses.length - 1)],
        start_time: `${date}T${startTime}:00+10:00`,
        end_time: `${date}T${endTime}:00+10:00`
      });
    }
    
    // Generate reservations for this table
    const reservations = [];
    const reservationCount = tableRandom(0, 2); // 0-2 reservations per table
    
    for (let i = 0; i < reservationCount && availableTimeSlots.length > 0; i++) {
      // Find an available time slot
      const randomIndex = tableRandom(0, availableTimeSlots.length - 1);
      const startTime = availableTimeSlots[randomIndex];
      const startTimeIndex = timeSlots.indexOf(startTime);
      
      // Remove used time slot from available slots
      availableTimeSlots.splice(randomIndex, 1);
      usedTimeSlots.add(startTime);
      
      // Calculate end time (ensure it doesn't exceed timeSlots bounds)
      const durationSlots = tableRandom(1, Math.min(4, timeSlots.length - startTimeIndex - 1));
      const endTimeIndex = Math.min(startTimeIndex + durationSlots, timeSlots.length - 1);
      const endTime = timeSlots[endTimeIndex];
      
      reservations.push({
        id: parseInt(`${table.id}${i + 1}`),
        name_for_reservation: customerNames[tableRandom(0, customerNames.length - 1)],
        num_people: tableRandom(1, table.capacity),
        phone_number: phoneNumbers[tableRandom(0, phoneNumbers.length - 1)],
        status: reservationStatuses[tableRandom(0, reservationStatuses.length - 1)],
        seating_time: `${date}T${startTime}:00+10:00`,
        end_time: `${date}T${endTime}:00+10:00`
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

// GET /api/available-days - Get available days
app.get('/api/available-days', (req, res) => {
  try {
    res.json(generateAvailableDays());
  } catch (error) {
    console.error('Error getting available days:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📅 API available at http://localhost:${PORT}/api`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});
