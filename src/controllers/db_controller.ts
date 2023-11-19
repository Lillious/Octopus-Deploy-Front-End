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

export const CreateAPIKey = (username: string, key: string) => {
    const db = GetDatabaseByName("api_keys.sqlite");
    Query(db, `DELETE FROM keys WHERE username='${username.toLowerCase()}'`);
    return Query(db, `INSERT INTO keys (username, key) VALUES ('${username.toLowerCase()}', '${key.toUpperCase()}')`);
}

export const ValidateAPIKey = (username:string, key: string) => {
    const db = GetDatabaseByName("api_keys.sqlite");
    const result = Query(db, `SELECT * FROM keys WHERE username='${username.toLowerCase()}' AND key='${key.toUpperCase()}'`);
    if (result.length > 0) return true;
    return false;
}