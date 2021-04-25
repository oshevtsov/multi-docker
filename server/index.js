const keys = require("./keys");

// Express app setup
const express = require("express");
const cors = require("cors");

const app = express();

// Enable CORS (Cross Origin Resource Sharing) middleware
// Allows to run requests from the React app on one domain to the Express API
// domain (or port in our case port)
app.use(cors());

// Will parse the body of the incoming requests into a json structure
app.use(express.json());

// Postgres client setup
const { Pool } = require("pg");

const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
});

pgClient.on("error", () => console.log("Lost PG connection"));

pgClient.on("connect", (client) => {
  client
    .query("CREATE TABLE IF NOT EXISTS values (number INT)")
    .catch((err) => console.error(err));
});

// Redis client setup
const redis = require("redis");

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
});

// We need to use duplicate here because each connection instance in redis
// client library (see docs) should be used for one purpose only. If we need to
// listen for some events and also publish events, we need two connection
// instances.
const redisPublisher = redisClient.duplicate();

// Express route handlers
app.get("/", (req, res) => {
  res.send("Hi");
});

app.get("/values/all", async (req, res) => {
  const values = await pgClient.query("SELECT * FROM values");
  res.send(values.rows);
});

app.get("/values/current", async (req, res) => {
  // redis library does not have promise support
  redisClient.hgetall("values", (err, values) => {
    res.send(values);
  });
});

app.post("/values", async (req, res) => {
  const index = req.body.index;

  if (parseInt(index) > 40) {
    return res.status(422).send("Index too high");
  }

  // Puts a value into Redis with placeholder value
  redisClient.hset("values", index, "Nothing yet");
  // Wake up the worker to do a calculation (it will also update the placeholder)
  redisPublisher.publish("insert", index);
  // Add new index to Postgres
  pgClient.query("INSERT INTO values (number) VALUES($1)", [index]);

  res.send({ working: true });
});

app.listen(5000, () => {
  console.log("Listening on port 5000");
});
