import { Database } from "bun:sqlite";
import {hash } from '../utility/hash';

export const GetDatabaseByName = (databaseName: string) => {
    return new Database(databaseName) as Database;
}

export const CreateDatabase = (databaseName: string) => {
    return new Database(databaseName, { create: true }) as Database;
}

export const CreateUser = (db: Database, username: string, email: string, password: string) => {
    const result = Query(db, `SELECT * FROM users WHERE username='${username.toLowerCase()}'`);
    if (result.length > 0) return false;
    Query(db, `INSERT INTO users (username, email, password) VALUES ('${username.toLowerCase()}', '${email.toLowerCase()}', '${hash(password)}')`);
    return true;
}

export const CloseConnection = (databaseName: string) => {
    const db = GetDatabaseByName(databaseName) as Database;
    db.close();
}

export const CreateTable = (db: Database, tableName: string, tableColumns: string) => {
    return Query(db, `CREATE TABLE IF NOT EXISTS ${tableName} (${tableColumns})`);
}

export const Query = (db: Database, query: string) => {
    return db.query(query).all();
}

export const Authenticate = (db: Database, username: string, password: string) => {
    return Query(db, `SELECT * FROM users WHERE username='${username.toLowerCase()}' AND password='${password}'`);
}

export const CreateAPIKey = (username: string, key: string, access_level: number) => {
    const db = GetDatabaseByName("api_keys.sqlite");
    Query(db, `DELETE FROM keys WHERE username='${username.toLowerCase()}'`);
    return Query(db, `INSERT INTO keys (username, key, access_level) VALUES ('${username.toLowerCase()}', '${key.toUpperCase()}', ${access_level})`);
}

export const ValidateAPIKey = (session: string) => {
    const user = Query(GetDatabaseByName("sessions.sqlite"), `SELECT * FROM sessions WHERE session='${session}'`);
    if (user.length > 0) {
        const db = GetDatabaseByName("api_keys.sqlite");
        const result = Query(db, `SELECT * FROM keys WHERE username='${(user[0] as { username: string }).username.toLowerCase()}'`);
        if (result.length > 0) return (result[0] as { access_level: number }).access_level;
        return false;
    }
}

export const CreateSession = (username: string, session: string) => {
    const db = GetDatabaseByName("sessions.sqlite");
    Query(db, `DELETE FROM sessions WHERE username='${username.toLowerCase()}'`);
    return Query(db, `INSERT INTO sessions (username, session) VALUES ('${username.toLowerCase()}', '${session}')`);
}

export const ValidateSession = (username: string, session: string) => {
    const db = GetDatabaseByName("sessions.sqlite");
    const result = Query(db, `SELECT * FROM sessions WHERE username='${username.toLowerCase()}' AND session='${session}'`);
    if (result.length > 0) return true;
    return false;
}

export const GetAPIKey = (username: string) => {
    const db = GetDatabaseByName("api_keys.sqlite");
    const result = Query(db, `SELECT * FROM keys WHERE username='${username.toLowerCase()}'`);
    if (result.length > 0) return (result[0] as { key: string }).key;
    return undefined;
}