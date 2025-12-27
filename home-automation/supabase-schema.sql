-- Home Automation Database Schema

-- Sensor readings table
CREATE TABLE IF NOT EXISTS sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sensor_type VARCHAR(50) NOT NULL,
  value NUMERIC NOT NULL,
  unit VARCHAR(20) NOT NULL,
  location VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX idx_sensor_readings_type ON sensor_readings(sensor_type);

-- Rooms configuration
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  target_temperature NUMERIC DEFAULT 21.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rules for automation
CREATE TABLE IF NOT EXISTS rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  condition JSONB NOT NULL,
  action JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Controller commands queue
CREATE TABLE IF NOT EXISTS controller_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  command_type VARCHAR(50) NOT NULL,
  parameters JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);

CREATE INDEX idx_controller_commands_status ON controller_commands(status);

-- Alerts and notifications
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  rule_id UUID REFERENCES rules(id),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX idx_alerts_acknowledged ON alerts(acknowledged);

-- System status
CREATE TABLE IF NOT EXISTS system_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  heating_active BOOLEAN DEFAULT false,
  power_available BOOLEAN DEFAULT true,
  internet_connected BOOLEAN DEFAULT true,
  controller_connected BOOLEAN DEFAULT false,
  last_update TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Insert default system status
INSERT INTO system_status (id, heating_active, power_available, internet_connected, controller_connected)
VALUES (gen_random_uuid(), false, true, true, false)
ON CONFLICT DO NOTHING;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rules_updated_at BEFORE UPDATE ON rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample rooms
INSERT INTO rooms (name, target_temperature) VALUES
  ('Гостиная', 22.0),
  ('Спальня', 20.0),
  ('Кухня', 21.0),
  ('Ванная', 24.0),
  ('Детская', 22.5)
ON CONFLICT DO NOTHING;

-- Insert sample rule
INSERT INTO rules (name, description, condition, action, enabled, priority)
VALUES (
  'Высокая температура подачи',
  'Уведомление при температуре подачи выше 80°C',
  '{"sensor_type": "temperature_heating_supply", "operator": "gt", "threshold": 80, "duration_seconds": 60}',
  '{"type": "notification", "notification_message": "Внимание! Температура подачи превысила 80°C"}',
  true,
  1
)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (optional, for multi-user scenarios)
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE controller_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
