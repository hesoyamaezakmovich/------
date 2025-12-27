#!/usr/bin/env node
/**
 * Example controller integration script (Node.js)
 * This script shows how to:
 * 1. Send sensor data to the API
 * 2. Fetch pending commands
 * 3. Execute commands and update their status
 */

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
const API_BASE_URL = 'http://localhost:3000/api';

class HomeController {
  constructor() {
    this.heatingEnabled = false;
    this.roomTemperatures = {
      living_room: 22.0,
      bedroom: 20.0,
      kitchen: 21.0,
    };
  }

  /**
   * Simulate reading sensor data
   */
  readSensors() {
    return {
      temperature_indoor: +(20 + (Math.random() - 0.5) * 4).toFixed(1),
      temperature_outdoor: +(5 + (Math.random() - 0.5) * 10).toFixed(1),
      temperature_heating_supply: +(70 + (Math.random() - 0.5) * 10).toFixed(1),
      temperature_heating_return: +(50 + (Math.random() - 0.5) * 6).toFixed(1),
      humidity_indoor: +(45 + (Math.random() - 0.5) * 20).toFixed(1),
      humidity_outdoor: +(70 + (Math.random() - 0.5) * 30).toFixed(1),
      pressure_outdoor: +(760 + (Math.random() - 0.5) * 40).toFixed(1),
      power_consumption: +(3 + Math.random() * 3).toFixed(2),
      voltage: +(230 + (Math.random() - 0.5) * 10).toFixed(1),
    };
  }

  /**
   * Send sensor reading to API
   */
  async sendSensorData(sensorType, value, unit) {
    try {
      const response = await fetch(`${API_BASE_URL}/sensors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sensor_type: sensorType,
          value,
          unit,
        }),
      });

      if (response.ok) {
        console.log(`✓ Sent ${sensorType}: ${value} ${unit}`);
      } else {
        console.error(`✗ Error sending ${sensorType}:`, await response.text());
      }
    } catch (error) {
      console.error(`✗ Error:`, error.message);
    }
  }

  /**
   * Fetch pending commands from Supabase
   */
  async fetchPendingCommands() {
    try {
      const url = new URL(`${SUPABASE_URL}/rest/v1/controller_commands`);
      url.searchParams.set('status', 'eq.pending');
      url.searchParams.set('order', 'created_at.asc');

      const response = await fetch(url, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error(`✗ Error fetching commands:`, error.message);
      return [];
    }
  }

  /**
   * Execute a controller command
   */
  executeCommand(command) {
    const { command_type, parameters } = command;

    console.log(`Executing command: ${command_type}`);

    switch (command_type) {
      case 'enable_heating':
        this.heatingEnabled = true;
        console.log('✓ Heating ENABLED');
        return true;

      case 'disable_heating':
        this.heatingEnabled = false;
        console.log('✓ Heating DISABLED');
        return true;

      case 'set_room_temperature':
        console.log(
          `✓ Set temperature for room ${parameters.room_id} to ${parameters.temperature}°C`
        );
        return true;

      default:
        console.log(`✗ Unknown command type: ${command_type}`);
        return false;
    }
  }

  /**
   * Update command status in Supabase
   */
  async updateCommandStatus(commandId, status) {
    try {
      const url = new URL(`${SUPABASE_URL}/rest/v1/controller_commands`);
      url.searchParams.set('id', `eq.${commandId}`);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          status,
          executed_at: new Date().toISOString(),
        }),
      });

      if (response.ok || response.status === 204) {
        console.log(`✓ Command ${commandId} marked as ${status}`);
      } else {
        console.error(`✗ Error updating command:`, await response.text());
      }
    } catch (error) {
      console.error(`✗ Error:`, error.message);
    }
  }

  /**
   * Main control loop
   */
  async run() {
    console.log('Starting Home Controller...');
    console.log(`Heating: ${this.heatingEnabled ? 'ON' : 'OFF'}`);

    const sensorUnits = {
      temperature_indoor: '°C',
      temperature_outdoor: '°C',
      temperature_heating_supply: '°C',
      temperature_heating_return: '°C',
      humidity_indoor: '%',
      humidity_outdoor: '%',
      pressure_outdoor: 'мм рт.ст.',
      power_consumption: 'кВт',
      voltage: 'В',
    };

    while (true) {
      try {
        // Read and send sensor data
        console.log('\n--- Reading sensors ---');
        const sensors = this.readSensors();

        for (const [sensorType, value] of Object.entries(sensors)) {
          const unit = sensorUnits[sensorType] || '';
          await this.sendSensorData(sensorType, value, unit);
        }

        // Fetch and execute pending commands
        console.log('\n--- Checking for commands ---');
        const commands = await this.fetchPendingCommands();

        if (commands.length > 0) {
          console.log(`Found ${commands.length} pending command(s)`);
          for (const command of commands) {
            const success = this.executeCommand(command);
            await this.updateCommandStatus(
              command.id,
              success ? 'acknowledged' : 'failed'
            );
          }
        } else {
          console.log('No pending commands');
        }

        console.log(
          `\n✓ Cycle complete. Heating: ${this.heatingEnabled ? 'ON' : 'OFF'}`
        );
        console.log('Waiting 30 seconds...\n');
        await new Promise(resolve => setTimeout(resolve, 30000));
      } catch (error) {
        console.error(`✗ Error in main loop:`, error.message);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }
}

// Run the controller
const controller = new HomeController();
controller.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
