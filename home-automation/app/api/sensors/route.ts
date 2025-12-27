import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/sensors - Add new sensor reading
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sensor_type, value, unit, location } = body;

    if (!sensor_type || value === undefined || !unit) {
      return NextResponse.json(
        { error: 'Missing required fields: sensor_type, value, unit' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('sensor_readings')
      .insert({
        sensor_type,
        value,
        unit,
        location,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

// GET /api/sensors - Get sensor readings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sensor_type = searchParams.get('sensor_type');
    const limit = parseInt(searchParams.get('limit') || '100');
    const hours = parseInt(searchParams.get('hours') || '24');

    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('sensor_readings')
      .select('*')
      .gte('timestamp', startTime)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (sensor_type) {
      query = query.eq('sensor_type', sensor_type);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch sensor readings' },
      { status: 500 }
    );
  }
}
