
export interface WeatherService {
  getWeather(city: string): Promise<number | null>;
}
