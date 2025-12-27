// Database types
export interface SensorReading {
  id: string;
  timestamp: string;
  sensor_type: SensorType;
  value: number;
  unit: string;
  location?: string;
}

export type SensorType =
  | 'temperature_indoor'
  | 'temperature_outdoor'
  | 'temperature_heating_supply'
  | 'temperature_heating_return'
  | 'humidity_indoor'
  | 'humidity_outdoor'
  | 'pressure_outdoor'
  | 'power_consumption'
  | 'voltage'
  | 'water_flow_cold'
  | 'water_flow_hot'
  | 'gas_consumption'
  | 'heating_pressure';

export interface Room {
  id: string;
  name: string;
  target_temperature: number;
  current_temperature?: number;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  condition: RuleCondition;
  action: RuleAction;
  enabled: boolean;
  priority: number;
}

export interface RuleCondition {
  sensor_type: SensorType;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration_seconds?: number; // How long condition must be true
}

export interface RuleAction {
  type: 'notification' | 'controller_command' | 'both';
  notification_message?: string;
  controller_command?: ControllerCommand;
}

export interface ControllerCommand {
  id: string;
  command_type: string;
  parameters: Record<string, any>;
  status: 'pending' | 'sent' | 'acknowledged' | 'failed';
  created_at: string;
  executed_at?: string;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  description: string;
  wind_speed: number;
  forecast: WeatherForecast[];
}

export interface WeatherForecast {
  timestamp: string;
  temperature: number;
  description: string;
  precipitation_probability: number;
}

export interface Alert {
  id: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  rule_id?: string;
  acknowledged: boolean;
}

export interface SystemStatus {
  heating_active: boolean;
  power_available: boolean;
  internet_connected: boolean;
  controller_connected: boolean;
  last_update: string;
}
