import * as db_controller from "./controllers/db_controller";
import { randomBytes } from './utility/hash';
import express from 'express';
import https from 'https';
import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
const app = express();

const cert = Bun.file(Bun.pathToFileURL(__dirname + "/certs/cert.crt").pathname);
const ca = Bun.file(Bun.pathToFileURL(__dirname + "/certs/cert.ca-bundle").pathname);
const key = Bun.file(Bun.pathToFileURL(__dirname + "/certs/cert.key").pathname);

async function CheckCertificatesExists(cert: BunFile, ca: BunFile, key: BunFile) {
  if (await cert.exists() && await ca.exists() && await key.exists()) return true;
  return false;
}

const _https = await CheckCertificatesExists(cert, ca, key);
console.log(`HTTPS: ${_https}`);

if (_https) {
  app.use((req: any, res: any, next: any) => {
    if (!req.secure) {
      res.redirect("https://" + req.headers.host + req.url);
    } else {
      next();
    }
  });
}

// Swagger Documentation
const options: swaggerJsdoc.Options = {
  definition: {
      openapi: "3.0.0",
      info: {
          title: "Octopus Deploy Authentication REST API",
          version: "1.0.0",
          description: "An API for authenticating with Octopus Deploy",
      },
  },
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);
const docsPath = "/docs";

// Server configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.disable("x-powered-by");
app.use(cookieParser());

// Session Setup
app.use(
  cookieSession({
    name: "session",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: "/",
    domain: "*.*",
    keys: [process.env.SESSION_KEY || randomBytes(32)],
  })
);

// Swagger Documentation
app.use(docsPath, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/swagger.json", (req: express.Request, res: express.Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
});

// Authentication Middleware API
import { router as auth } from './routes/auth';
app.use(auth);

// Import API Routes
import { router as api } from './routes/api';
import { BunFile } from "bun";
app.use(api);


app.use("/",express.static(Bun.pathToFileURL(__dirname + "/www/public").pathname));
app.use("/dashboard",express.static(Bun.pathToFileURL(__dirname + "/www/dashboard").pathname));

// Start express with https if the certificates are present
app.listen(80, () => {
  console.log(`Server started at http://localhost`);
  console.log(`Swagger docs available at http://localhost${docsPath}`);
});

// Disable https for testing
if (_https) {
  https.createServer({
    cert: await cert.text(),
    ca: await ca.text(),
    key: await key.text(),
  }, app).listen(443);
}

app.use("*", (req, res) => {
    res.status(404).redirect("/");
});

// Create the databases and tables
const db_users = db_controller.CreateDatabase("users.sqlite");
const db_api_keys = db_controller.CreateDatabase("api_keys.sqlite");
const db_sessions = db_controller.CreateDatabase("sessions.sqlite");

db_controller.CreateTable(db_users, "users", "id INTEGER PRIMARY KEY, username TEXT, email TEXT, password TEXT");
db_controller.CreateTable(db_api_keys, "keys", "id INTEGER PRIMARY KEY, username TEXT, key TEXT, access_level INTEGER");
db_controller.CreateTable(db_sessions, "sessions", "id INTEGER PRIMARY KEY, session TEXT, username TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP");

// Create a test user
db_controller.CreateUser(db_users, "user", "user@example.com", "1234");
// Create a test API key for the test user
db_controller.CreateAPIKey("user", "API-1E4EC1C512A4447463751A26043F2FA0", 3);

import("./utility/jobs");