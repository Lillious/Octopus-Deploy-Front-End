import * as db from "./controllers/db_controller";
import express from 'express';
import path from 'path';
const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import API Routes
import { router as api } from './routes/api';
app.use(api);

import { router as auth } from './routes/auth';
app.use(auth);


app.use("/",express.static(path.join(__dirname, "/www/public/")));

app.get('*', (req, res) => {
    res.status(404).send({
        error: 'NOT_FOUND'
    });
});

app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});

// Create the databases and tables
const db_users = db.CreateDatabase("users.sqlite");
const db_api_keys = db.CreateDatabase("api_keys.sqlite");

db.CreateTable(db_users, "users", "id INTEGER PRIMARY KEY, username TEXT, email TEXT, password TEXT");
db.CreateTable(db_api_keys, "keys", "id INTEGER PRIMARY KEY, username TEXT, key TEXT");

// Create a test user
db.CreateUser(db_users, "user", "user@example.com", "1234");