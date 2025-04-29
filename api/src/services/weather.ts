
export class WeatherService {
  async getWeather(city: string) {
    try {
      // TODO fetch from api
      return {
        temperature: 20,
        condition: "Ensolarado"
      };
    } catch (error) {
      console.error("Error fetching weather:", error);
      return null;
    }
  }
}
