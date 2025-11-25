import { Injectable } from '@angular/core';
import { fetchWeatherApi } from 'openmeteo';

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  async getLocation(
    query: string
  ): Promise<{ latitude: number; longitude: number; name: string } | null> {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query
    )}&count=1`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.results && data.results.length > 0) {
      const loc = data.results[0];
      return { latitude: loc.latitude, longitude: loc.longitude, name: loc.name };
    }
    return null;
  }

  async getWeather(latitude: number, longitude: number) {
    const params = {
      latitude,
      longitude,
      hourly: 'temperature_2m,weather_code',
      daily: 'temperature_2m_max,temperature_2m_min,weather_code',
      current: [
        'precipitation',
        'wind_speed_10m',
        'is_day',
        'apparent_temperature',
        'temperature_2m',
        'relative_humidity_2m',
        'weather_code'
      ],
    };

    const url = 'https://api.open-meteo.com/v1/forecast';
    const responses = await fetchWeatherApi(url, params);
    const response = responses[0];
    const utcOffsetSeconds = response.utcOffsetSeconds();

    const current = response.current()!;
    const hourly = response.hourly()!;
    const daily = response.daily()!;

    // --- HOURLY FORECAST FOR NEXT 7 DAYS ---
    const startTime = Number(hourly.time());
    const interval = hourly.interval();
    const hourlyTemperatureValues = hourly.variables(0)?.valuesArray() ?? [];
    const hourlyWeatherCodeValues = hourly.variables(1)?.valuesArray() ?? [];
    const hourlyTimes = Array.from(
      { length: hourlyTemperatureValues.length },
      (_, i) => new Date((startTime + i * interval + utcOffsetSeconds) * 1000)
    );

    // --- DAILY FORECAST ---
    const dailyTimes = Array.from(
      {
        length:
          (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval(),
      },
      (_, i) =>
        new Date(
          (Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) *
            1000
        )
    );

    const weatherData = {
      current: {
        time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
        precipitation: current.variables(0)?.value() ?? 0,
        wind_speed_10m: current.variables(1)?.value() ?? 0,
        apparent_temperature: current.variables(3)?.value() ?? 0,
        temperature_2m: current.variables(4)!.value() ?? 0,
        relative_humidity_2m: current.variables(5)!.value() ?? 0,
        weather_code: current.variables(6)!.value(),
      },
      hourly: hourlyTimes.map((time, i) => ({
        time,
        temperature_2m: hourlyTemperatureValues[i] ?? 0,
        weather_code: hourlyWeatherCodeValues[i] ?? 0,
      })),
      daily: dailyTimes.map((time, i) => ({
        time,
        temp_max: daily.variables(0)?.valuesArray()?.[i] ?? 0,
        temp_min: daily.variables(1)?.valuesArray()?.[i] ?? 0,
        weather_code: daily.variables(2)?.valuesArray()?.[i] ?? 0,
      })),
    };

    return weatherData;
  }
}