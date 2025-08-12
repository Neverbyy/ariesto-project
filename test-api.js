const fetch = require('node-fetch');

async function testAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/reservations/2025-08-12');
    const data = await response.json();
    
    console.log('=== API Response ===');
    console.log('Tables count:', data.tables?.length || 0);
    
    // Check first few tables with orders
    data.tables?.forEach((table, index) => {
      if (table.orders && table.orders.length > 0) {
        console.log(`\nTable ${table.number} (${table.zone}):`);
        table.orders.forEach(order => {
          console.log(`  Order ${order.id}: ${order.status} - ${order.start_time} to ${order.end_time}`);
        });
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();
