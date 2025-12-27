#!/usr/bin/env python3
"""
Example controller integration script
This script shows how to:
1. Send sensor data to the API
2. Fetch pending commands
3. Execute commands and update their status
"""

import time
import random
import requests
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:3000/api"
SUPABASE_URL = "YOUR_SUPABASE_URL"
SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY"

class HomeController:
    def __init__(self):
        self.heating_enabled = False
        self.room_temperatures = {
            "living_room": 22.0,
            "bedroom": 20.0,
            "kitchen": 21.0,
        }

    def read_sensors(self):
        """Simulate reading sensor data"""
        return {
            "temperature_indoor": round(20 + random.uniform(-2, 2), 1),
            "temperature_outdoor": round(5 + random.uniform(-5, 5), 1),
            "temperature_heating_supply": round(70 + random.uniform(-5, 5), 1),
            "temperature_heating_return": round(50 + random.uniform(-3, 3), 1),
            "humidity_indoor": round(45 + random.uniform(-10, 10), 1),
            "humidity_outdoor": round(70 + random.uniform(-15, 15), 1),
            "pressure_outdoor": round(760 + random.uniform(-20, 20), 1),
            "power_consumption": round(3 + random.uniform(-1, 3), 2),
            "voltage": round(230 + random.uniform(-5, 5), 1),
        }

    def send_sensor_data(self, sensor_type, value, unit):
        """Send sensor reading to API"""
        try:
            response = requests.post(
                f"{API_BASE_URL}/sensors",
                json={
                    "sensor_type": sensor_type,
                    "value": value,
                    "unit": unit,
                }
            )
            if response.status_code == 200:
                print(f"✓ Sent {sensor_type}: {value} {unit}")
            else:
                print(f"✗ Error sending {sensor_type}: {response.text}")
        except Exception as e:
            print(f"✗ Error: {e}")

    def fetch_pending_commands(self):
        """Fetch pending commands from Supabase"""
        try:
            response = requests.get(
                f"{SUPABASE_URL}/rest/v1/controller_commands",
                params={"status": "eq.pending", "order": "created_at.asc"},
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}"
                }
            )
            if response.status_code == 200:
                return response.json()
            return []
        except Exception as e:
            print(f"✗ Error fetching commands: {e}")
            return []

    def execute_command(self, command):
        """Execute a controller command"""
        command_type = command["command_type"]
        params = command["parameters"]

        print(f"Executing command: {command_type}")

        if command_type == "enable_heating":
            self.heating_enabled = True
            print("✓ Heating ENABLED")

        elif command_type == "disable_heating":
            self.heating_enabled = False
            print("✓ Heating DISABLED")

        elif command_type == "set_room_temperature":
            room_id = params.get("room_id")
            temperature = params.get("temperature")
            print(f"✓ Set temperature for room {room_id} to {temperature}°C")

        else:
            print(f"✗ Unknown command type: {command_type}")
            return False

        return True

    def update_command_status(self, command_id, status):
        """Update command status in Supabase"""
        try:
            response = requests.patch(
                f"{SUPABASE_URL}/rest/v1/controller_commands",
                params={"id": f"eq.{command_id}"},
                json={
                    "status": status,
                    "executed_at": datetime.utcnow().isoformat()
                },
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                }
            )
            if response.status_code in [200, 204]:
                print(f"✓ Command {command_id} marked as {status}")
            else:
                print(f"✗ Error updating command: {response.text}")
        except Exception as e:
            print(f"✗ Error: {e}")

    def run(self):
        """Main control loop"""
        print("Starting Home Controller...")
        print(f"Heating: {'ON' if self.heating_enabled else 'OFF'}")

        sensor_units = {
            "temperature_indoor": "°C",
            "temperature_outdoor": "°C",
            "temperature_heating_supply": "°C",
            "temperature_heating_return": "°C",
            "humidity_indoor": "%",
            "humidity_outdoor": "%",
            "pressure_outdoor": "мм рт.ст.",
            "power_consumption": "кВт",
            "voltage": "В",
        }

        while True:
            try:
                # Read and send sensor data
                print("\n--- Reading sensors ---")
                sensors = self.read_sensors()
                for sensor_type, value in sensors.items():
                    unit = sensor_units.get(sensor_type, "")
                    self.send_sensor_data(sensor_type, value, unit)

                # Fetch and execute pending commands
                print("\n--- Checking for commands ---")
                commands = self.fetch_pending_commands()

                if commands:
                    print(f"Found {len(commands)} pending command(s)")
                    for command in commands:
                        if self.execute_command(command):
                            self.update_command_status(command["id"], "acknowledged")
                        else:
                            self.update_command_status(command["id"], "failed")
                else:
                    print("No pending commands")

                print(f"\n✓ Cycle complete. Heating: {'ON' if self.heating_enabled else 'OFF'}")
                print("Waiting 30 seconds...\n")
                time.sleep(30)

            except KeyboardInterrupt:
                print("\n\nStopping controller...")
                break
            except Exception as e:
                print(f"✗ Error in main loop: {e}")
                time.sleep(10)

if __name__ == "__main__":
    controller = HomeController()
    controller.run()
