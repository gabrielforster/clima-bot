
import { collectDefaultMetrics, Registry, Histogram } from "prom-client";

const register = new Registry();
collectDefaultMetrics({ register });

const requestDuration = new Histogram({
  name: "request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route"],
  registers: [register],
});

export { register, requestDuration };
