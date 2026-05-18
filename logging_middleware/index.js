const axios = require("axios");

const LOG_API = "http://4.224.186.213/evaluation-service/logs";
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJwcmFzYWRrYW5kZWthcjJAZ21haWwuY29tIiwiZXhwIjoxNzc5MTAxNDM2LCJpYXQiOjE3NzkxMDA1MzYsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiI1MTRlYWZkYS01OTY5LTQ4MjktYjZmZC0xZGE5ODdiMmM2MTgiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJwcmFzYWQga2FuZGVrYXIiLCJzdWIiOiI5OTc0NTc5Zi1kNzY3LTQ0ZmItYjM2Yy05ZTExZjY2NmQxMjYifSwiZW1haWwiOiJwcmFzYWRrYW5kZWthcjJAZ21haWwuY29tIiwibmFtZSI6InByYXNhZCBrYW5kZWthciIsInJvbGxObyI6IjcyMzA4ODE5ZiIsImFjY2Vzc0NvZGUiOiJmekVRU1EiLCJjbGllbnRJRCI6Ijk5NzQ1NzlmLWQ3NjctNDRmYi1iMzZjLTllMTFmNjY2ZDEyNiIsImNsaWVudFNlY3JldCI6InlZd01IZnJZa2ptdnJhTk0ifQ.3iZa9YiacoqrnJszDATtCeMf2aQn76EJL6M7ABQ_VkI";

const VALID_STACKS = ["backend"];
const VALID_LEVELS = ["debug", "info", "warn", "error", "fatal"];
const VALID_BACKEND_PACKAGES = ["cache", "controller", "cron_job", "db", "domain", "handler", "repository", "route", "service"];

const VALID_SHARED_PACKAGES = ["auth", "config", "middleware", "utils"];

async function Log(stack, level, pkg, message) {
  if (!VALID_STACKS.includes(stack)) throw new Error(`Invalid stack: ${stack}`);
  if (!VALID_LEVELS.includes(level)) throw new Error(`Invalid level: ${level}`);

  const validPackages = [...VALID_BACKEND_PACKAGES, ...VALID_SHARED_PACKAGES];

  if (!validPackages.includes(pkg)) throw new Error(`Invalid package: ${pkg} for stack: ${stack}`);

  const response = await axios.post(
    LOG_API,
    { stack, level, package: pkg, message },
    { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
  );

  return response.data;
}

module.exports = { Log };
