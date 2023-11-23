import express from 'express';
import { ValidateAPIKey, Authenticate, GetDatabaseByName, ValidateSession, CreateSession, GetAPIKey } from '../controllers/db_controller';
import { hash, randomBytes } from '../utility/hash';
export const router = express.Router();
const apiPath = '/api/v1';

function getCookie(cookies: string, name: string) {
    var match = cookies.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return match[2];
}

// Catch all paths and check for API key in body
router.all(`${apiPath}/*`, (req, res, next) => {
    const session = getCookie(req.headers.cookie as string, "session");
    const username = getCookie(req.headers.cookie as string, "username");
    if (!session || !username) return res.status(403).send({
        error: "INVALID_SESSION"
    });

    const auth = ValidateSession(username, session);
    if (!auth) return res.status(403).send({
        error: "INVALID_SESSION"
    });

    // Get API Key
    const key = GetAPIKey(username);
    if (!key) return res.status(403).send({
        error: "INVALID_API_KEY"
    });

    // Validate API Key
    const valid = ValidateAPIKey(username, key);
    if (!valid) return res.status(403).send({
        error: "INVALID_API_KEY"
    });

    next();
});

router.all(`/dashboard/*`, (req, res, next) => {
    if (!req?.cookies?.username || !req?.cookies?.session) return res.status(403).redirect('/');

    const auth = ValidateSession(req.cookies.username, req.cookies.session);
    if (!auth) return res.status(403).redirect('/');

    next();
});

router.get('/', (req, res, next) => {
    // If the user is already logged in, redirect to dashboard
    if (req?.cookies?.username && req?.cookies?.session) {
        const auth = ValidateSession(req.cookies.username, req.cookies.session);
        if (auth) return res.redirect('/dashboard');
        // Clear cookies
        res.clearCookie('session');
        res.clearCookie('username');
        res.redirect('back');
    } else {
        next();
    }
});

router.post('/login', (req, res) => {
    if (!req?.body?.username || !req?.body?.password) return res.status(403).send(
        {
            error: "INVALID_CREDENTIALS"
        }
    );

    const db = GetDatabaseByName("users.sqlite");
    const result = Authenticate(db, req.body.username, hash(req.body.password)) as any;

    if (result.length > 0) {
        const session = randomBytes(32);
        // Session is valid for 24 hours
        res.cookie("session", session, {
            maxAge: 86400000,
            httpOnly: true,
        });

        res.cookie("username", req.body.username.toLowerCase(), {
            maxAge: 86400000,
            httpOnly: true,
        });
        CreateSession(req.body.username.toLowerCase(), session);
        res.redirect('/dashboard');
    } else {
        return res.status(403).redirect('/');
    }
});

router.get('/logout', (req, res) => {
    res.clearCookie('session');
    res.clearCookie('username');
    res.redirect('/');
});