const http = require('http');

function makeRequest(date) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/reservations/${date}`,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testUniqueTimeSlots() {
  console.log('🧪 Testing unique time slots...\n');
  
  try {
    const data = await makeRequest('2024-01-01');
    
    data.tables.forEach(table => {
      const allItems = [
        ...table.orders.map(o => ({ type: 'order', start: o.start_time, id: o.id })),
        ...table.reservations.map(r => ({ type: 'reservation', start: r.seating_time, id: r.id }))
      ];
      
      // Extract time from ISO string
      const extractTime = (isoString) => {
        const match = isoString.match(/T(\d{2}:\d{2}):\d{2}/);
        return match ? match[1] : '';
      };
      
      const startTimes = allItems.map(item => extractTime(item.start));
      const uniqueTimes = new Set(startTimes);
      
      if (startTimes.length !== uniqueTimes.size) {
        console.log(`❌ Table ${table.number} has duplicate start times:`);
        const duplicates = startTimes.filter((time, index) => startTimes.indexOf(time) !== index);
        console.log(`   Duplicates: ${[...new Set(duplicates)].join(', ')}`);
        
        // Show which items have duplicate times
        duplicates.forEach(duplicateTime => {
          const itemsWithTime = allItems.filter(item => extractTime(item.start) === duplicateTime);
          console.log(`   Items with time ${duplicateTime}:`, itemsWithTime.map(i => `${i.type} ${i.id}`));
        });
      } else {
        console.log(`✅ Table ${table.number}: All ${startTimes.length} items have unique start times`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testUniqueTimeSlots();
