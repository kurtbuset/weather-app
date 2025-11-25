import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherService } from '../services/weather.service';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [CommonModule, FormsModule],
  templateUrl: 'weather.component.html',
})
export class WeatherComponent {
  apiError = false;
  lastSearch = '';

  weather: any;
  searchValue = '';

  temperatureUnit: 'C' | 'F' = 'C';
  precipitationUnit: 'mm' | 'in' = 'mm';
  windSpeedUnit: 'km/h' | 'mph' = 'km/h';
  unitSystem: 'metric' | 'imperial' = 'metric'; // default metric
  selectedDay: Date | null = null;
  noResults = false;

  isUnitsOpen = false;
  isDayDropdownOpen = false;

  searchHistory: string[] = [];
  showHistory = false;

  toggleUnitsDropdown() {
    this.isUnitsOpen = !this.isUnitsOpen;
  }

  toggleDayDropdown() {
    this.isDayDropdownOpen = !this.isDayDropdownOpen;
  }

  constructor(private weatherService: WeatherService) {}

  async searchWeather() {
    if (!this.searchValue) return;

    this.apiError = false; // reset error
    this.lastSearch = this.searchValue;

    try {
      const loc = await this.weatherService.getLocation(this.searchValue);
      if (!loc) {
        this.noResults = true;
        this.weather = null;
        return;
      }

      const weatherData = await this.weatherService.getWeather(
        loc.latitude,
        loc.longitude
      );

      this.weather = {
        ...weatherData,
        locationName: loc.name,
      };

      if (!this.searchHistory.includes(this.searchValue)) {
        this.searchHistory.unshift(this.searchValue); // add to top
        if (this.searchHistory.length > 5) this.searchHistory.pop(); // limit history to 5 items
      }

      this.noResults = false;
      this.apiError = false;
      this.selectedDay = this.weather.daily[0]?.time ?? null;
    } catch (err) {
      console.error('API ERROR:', err);
      this.apiError = true;
      this.weather = null;
    }
  }

  hideHistory() {
    setTimeout(() => {
      this.showHistory = false;
    }, 150);
  }

  retry() {
    if (this.lastSearch) {
      this.searchWeather();
    }
  }

  getHourlyForSelectedDay() {
    if (!this.weather || !this.selectedDay) return [];
    const startOfDay = new Date(this.selectedDay);
    console.log('start of day: ', startOfDay);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    return this.weather.hourly.filter(
      (hour: any) => hour.time >= startOfDay && hour.time <= endOfDay
    );
  }

  // Convert precipitation based on unit
  getPrecipitation(): string {
    if (!this.weather) return '';
    let precip = this.weather.current.precipitation;
    if (this.precipitationUnit === 'in') {
      precip = precip / 25.4; // 1 inch = 25.4 mm
    }
    return Math.round(precip).toString();
  }

  getWindSpeed(): string {
    if (!this.weather) return '';
    let speed = this.weather.current.wind_speed_10m;
    if (this.windSpeedUnit === 'mph') {
      speed = speed / 1.609; // 1 mile = 1.609 km
    }
    return Math.round(speed).toString();
  }

  setTemperatureUnit(unit: 'C' | 'F') {
    this.temperatureUnit = unit;
    this.isUnitsOpen = false;
  }

  setPrecipitationUnit(unit: 'mm' | 'in') {
    this.precipitationUnit = unit;
    this.isUnitsOpen = false;
  }

  setWindSpeedUnit(unit: 'km/h' | 'mph') {
    this.windSpeedUnit = unit;
    this.isUnitsOpen = false;
  }

  convertTemperature(temp: number): string {
    if (this.temperatureUnit === 'C') {
      return `${temp.toFixed(1)}°`;
    } else {
      const fahrenheit = (temp * 9) / 5 + 32;
      return `${fahrenheit.toFixed(1)}°`;
    }
  }

  toggleUnitSystem() {
    if (this.unitSystem === 'metric') {
      this.unitSystem = 'imperial';
      this.temperatureUnit = 'F';
      this.windSpeedUnit = 'mph';
      this.precipitationUnit = 'in';
    } else {
      this.unitSystem = 'metric';
      this.temperatureUnit = 'C';
      this.windSpeedUnit = 'km/h';
      this.precipitationUnit = 'mm';
    }
    this.isUnitsOpen = false; // close dropdown
  }

  getWeatherIcon(code: number): string {
    // Convert to integer to handle decimal values from API
    const intCode = Math.floor(code);

    if (intCode === 0) return 'assets/images/icon-sunny.webp';
    if (intCode === 1 || intCode === 2)
      return 'assets/images/icon-partly-cloudy.webp';
    if (intCode === 3) return 'assets/images/icon-overcast.webp';
    if ([51, 53, 55].includes(intCode))
      return 'assets/images/icon-drizzle.webp';
    if ([61, 63, 65].includes(intCode)) return 'assets/images/icon-rain.webp';
    if ([71, 73, 75].includes(intCode)) return 'assets/images/icon-snow.webp';
    if ([95, 96, 99].includes(intCode)) return 'assets/images/icon-storm.webp';
    if (intCode === 45 || intCode === 48) return 'assets/images/icon-fog.webp';
    return 'assets/images/icon-sunny.webp'; // fallback
  }
}
