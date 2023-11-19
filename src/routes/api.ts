import express from 'express';
import { ValidateAPIKey } from '../controllers/db_controller';
export const router = express.Router();
const apiPath = '/api/v1';

router.post(`${apiPath}/validate`, (req, res) => {
    if (!req?.body?.api_key || !req?.body?.username) return res.status(403).send({
        success: false
    });

    const result = ValidateAPIKey(req.body.username, req.body.api_key);

    if (result) {
        res.status(200).send({
            success: true
        });
    } else {
        res.status(403).send({
            success: false
        });
    }
});