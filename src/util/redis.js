const redis = require("redis");
require("dotenv").config();

const url = process.env.REDIS_URL;

const client = redis.createClient({
  url: url,
});

client.on("connect", () => {
  console.log("Connected to Redis server");
});

client.on("error", (err) => {
  console.error("Error connecting to Redis server:", err.message);
});

(async () => {
  try {
    await client.connect();
  } catch (err) {
    console.error("Error connecting to Redis server:", err.message);
  }
})();

module.exports = () => {
  const SetRedis = async (key, val, expireTime) => {
    console.log("Redis=> SetRedis");
    if (!client.isOpen) {
      return Promise.reject("Redis client is not connected");
    }

    const newVal = JSON.stringify(val);
    await client.set(key, newVal);

    if (expireTime) {
      await client.expire(key, expireTime);
    }

    return Promise.resolve("Value set in Redis");
  };

  const GetKeys = async (key, isScan = false) => {
    console.log("Redis=> GetKeys");
    if (!client.isOpen) {
      throw new Error("Redis client is not connected");
    }

    const exists = await client.exists(key);
    return exists ? Promise.resolve([key]) : Promise.resolve([]);
  };

  const GetKeyRedis = async (key) => {
    console.log("Redis=> GetKeyRedis");
    if (!client.isOpen) {
      return Promise.resolve(false);
    }

    const reply = await client.get(key);
    return reply ? Promise.resolve(reply) : Promise.resolve(false);
  };

  const GetRedis = async (key) => {
    console.log("Redis=> GetRedis");

    if (!client.isOpen) {
      throw new Error("Redis client is not connected");
    }

    const reply = await client.mGet(key);
    return reply ? Promise.resolve(reply) : Promise.resolve([]);
  };

  const DelRedis = async (key) => {
    console.log("Redis=> DelRedis");
    if (!client.isOpen) {
      throw new Error("Redis client is not connected");
    }

    return client.del(key);
  };

  // Increments a counter, starting its expiry on the first hit.
  const IncrRedis = async (key, expireTime) => {
    console.log("Redis=> IncrRedis");
    if (!client.isOpen) {
      throw new Error("Redis client is not connected");
    }

    const count = await client.incr(key);
    if (count === 1 && expireTime) {
      await client.expire(key, expireTime);
    }
    return count;
  };

  // Sets the key only if it doesn't exist. Returns true when it was set.
  const SetNxRedis = async (key, val, expireTime) => {
    console.log("Redis=> SetNxRedis");
    if (!client.isOpen) {
      throw new Error("Redis client is not connected");
    }

    const reply = await client.set(key, JSON.stringify(val), {
      NX: true,
      ...(expireTime ? { EX: expireTime } : {}),
    });
    return reply === "OK";
  };

  return {
    SetRedis,
    GetKeys,
    GetKeyRedis,
    GetRedis,
    DelRedis,
    IncrRedis,
    SetNxRedis,
  };
};
