import { WeatherService } from "./interface";

const BASE_URL = "https://geocoding-api.open-meteo.com/v1/search"

export class OpenMeteoWeatherService implements WeatherService {
  async getWeather(city: string): Promise<number | null> {
    try {
      const url = new URL(BASE_URL);
      url.searchParams.append("name", city);
      url.searchParams.append("language", "pt");
      url.searchParams.append("countryCode", "BR");

      const response = await fetch(url.toString());
      const { results } = await response.json();
      const [result] = results;

      const { latitude, longitude }  = result;

      const temeparatureUrl = new URL("https://api.open-meteo.com/v1/forecast");
      temeparatureUrl.searchParams.append("latitude", latitude.toString());
      temeparatureUrl.searchParams.append("longitude", longitude.toString());
      temeparatureUrl.searchParams.append("current_weather", "true");
      temeparatureUrl.searchParams.append("timezone", "America/Sao_Paulo");
      temeparatureUrl.searchParams.append("language", "pt");
      temeparatureUrl.searchParams.append("temperature_unit", "celsius");
      temeparatureUrl.searchParams.append("windspeed_unit", "kmh");
      temeparatureUrl.searchParams.append("hourly", "temperature_2m");
      temeparatureUrl.searchParams.append("forecast_days", "1");

      const temperatureResponse = await fetch(temeparatureUrl.toString());

      const { hourly } = await temperatureResponse.json();
      const { temperature_2m } = hourly;
      const hourNow = new Date().getHours();
      const temperature = temperature_2m[hourNow];

      return temperature;
    } catch (error) {
      console.error("error fetching weather on openmeteo:", error);
      return null;
    }
  }
}
