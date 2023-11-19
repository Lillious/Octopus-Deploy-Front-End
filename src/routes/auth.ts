import express from 'express';
import {hash, randomBytes } from '../utility/hash';
import { GetDatabaseByName, Authenticate, CreateAPIKey } from '../controllers/db_controller';
export const router = express.Router();
const apiPath = '/api/v1';

router.post(`${apiPath}/authenticate`, (req, res) => {
    if (!req?.body?.username || !req?.body?.password) return res.status(403).redirect('/');

    const db = GetDatabaseByName("users.sqlite");
    const result = Authenticate(db, req.body.username, hash(req.body.password)) as any;

    if (result.length > 0) {
        const key = GenerateAPIKey(result[0].username);
        res.send({
            success: true,
            data: {
                username: result[0].username,
                api_key: key
            }
        });
    } else {
        return res.status(403).redirect('/');
    }
});

function GenerateAPIKey(username: string) {
    const key = `API-${randomBytes(16)}`.toUpperCase();
    CreateAPIKey(username.toLowerCase(), key);
    return key;
}