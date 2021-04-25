const keys = require("./keys");
const redis = require("redis");

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  // reconnect to Redis in 1 second if connection is lost
  retry_strategy: () => 1000,
});

const sub = redisClient.duplicate();

// slow, simulates a long-running job iin a worker process
function fib(index) {
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);
}

sub.on("message", (_, message) => {
  redisClient.hset("values", message, fib(parseInt(message)));
});

sub.subscribe("insert");
