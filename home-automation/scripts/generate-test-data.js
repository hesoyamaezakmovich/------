// Script to generate test sensor data
// Run with: node scripts/generate-test-data.js

const SUPABASE_URL = 'https://lcoaegeqjzfcerhjbyco.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZfuO07xokoLjWnlkXWwkPA_9MhVFe_d';

async function generateTestData() {
  const sensors = [
    { type: 'temperature_indoor', min: 20, max: 24, unit: '°C' },
    { type: 'temperature_outdoor', min: -10, max: 30, unit: '°C' },
    { type: 'temperature_heating_supply', min: 60, max: 80, unit: '°C' },
    { type: 'temperature_heating_return', min: 40, max: 60, unit: '°C' },
    { type: 'humidity_indoor', min: 30, max: 60, unit: '%' },
    { type: 'humidity_outdoor', min: 40, max: 90, unit: '%' },
    { type: 'pressure_outdoor', min: 740, max: 780, unit: 'мм рт.ст.' },
    { type: 'power_consumption', min: 1, max: 8, unit: 'кВт' },
    { type: 'voltage', min: 220, max: 240, unit: 'В' },
  ];

  const readings = [];
  const now = new Date();

  // Generate data for last 24 hours, every 5 minutes
  for (let i = 0; i < 288; i++) {
    const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000);

    sensors.forEach(sensor => {
      const value =
        sensor.min +
        Math.random() * (sensor.max - sensor.min) +
        Math.sin(i / 10) * ((sensor.max - sensor.min) / 10);

      readings.push({
        sensor_type: sensor.type,
        value: parseFloat(value.toFixed(2)),
        unit: sensor.unit,
        timestamp: timestamp.toISOString(),
      });
    });
  }

  console.log(`Generated ${readings.length} test readings`);
  console.log('Sample:', readings[0]);

  // Insert to Supabase
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/sensor_readings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(readings),
    });

    if (response.ok) {
      console.log('✓ Test data inserted successfully!');
    } else {
      console.error('✗ Error inserting data:', await response.text());
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.log('\nTo insert data, update SUPABASE_URL and SUPABASE_KEY in this script');
  }
}

generateTestData();
