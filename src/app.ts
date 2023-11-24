import * as db from "./controllers/db_controller";
import { randomBytes } from './utility/hash';
import express from 'express';
import path from 'path';
import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
const app = express();
const port = process.env.PORT || 8080;
const host = process.env.HOST || "0.0.0.0";

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
app.use(api);


app.use("/",express.static(path.join(__dirname, "/www/public/")));
app.use("/dashboard",express.static(path.join(__dirname, "/www/dashboard/")));

app.listen(port as number, host as string, () => {
    console.log(`Server started at http://localhost:${port}`);
    console.log(`Swagger docs available at http://localhost:${port}${docsPath}`);
});

app.use("*", (req, res) => {
    res.status(404).redirect("/");
});

// Create the databases and tables
const db_users = db.CreateDatabase("users.sqlite");
const db_api_keys = db.CreateDatabase("api_keys.sqlite");
const db_sessions = db.CreateDatabase("sessions.sqlite");

db.CreateTable(db_users, "users", "id INTEGER PRIMARY KEY, username TEXT, email TEXT, password TEXT");
db.CreateTable(db_api_keys, "keys", "id INTEGER PRIMARY KEY, username TEXT, key TEXT, access_level INTEGER");
db.CreateTable(db_sessions, "sessions", "id INTEGER PRIMARY KEY, session TEXT, username TEXT");

// Create a test user
db.CreateUser(db_users, "user", "user@example.com", "1234");
// Create a test API key for the test user
db.CreateAPIKey("user", "API-1E4EC1C512A4447463751A26043F2FA0", 3);