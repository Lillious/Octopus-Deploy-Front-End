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
    res.setHeader('Cache-Control', 'max-age=600');
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
    const valid = ValidateAPIKey(session);
    if (!valid) return res.status(403).send({
        error: "INVALID_API_KEY"
    });

    next();
});

function CheckAPIAccess(req: any, permission: string) {
    const permissions: { [key: string]: number } = { none: 0, read: 1, write: 2, admin: 3 };
    const access = ValidateAPIKey(getCookie(req.headers.cookie, "session") as string) || false;
    return access && access >= permissions[permission.toLowerCase()];
}

// Individual API endpoint access levels
router.get(`${apiPath}/*`, async (req, res, next) => {
    if (!CheckAPIAccess(req, "read")) return res.status(403).send({
        error: "INVALID_ACCESS_LEVEL"
    });
    next();
});

router.post(`${apiPath}/*`, async (req, res, next) => {
    if (!CheckAPIAccess(req, "write")) return res.status(403).send({
        error: "INVALID_ACCESS_LEVEL"
    });
    next();
});

router.put(`${apiPath}/*`, async (req, res, next) => {
    if (!CheckAPIAccess(req, "write")) return res.status(403).send({
        error: "INVALID_ACCESS_LEVEL"
    });
    next();
});

router.delete(`${apiPath}/*`, async (req, res, next) => {
    if (!CheckAPIAccess(req, "admin")) return res.status(403).send({
        error: "INVALID_ACCESS_LEVEL"
    });
    next();
});

router.all(`/dashboard/*`, (req, res, next) => {
    res.setHeader('Cache-Control', 'max-age=600');
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
        // Clear cookies if session is invalid
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