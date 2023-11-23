import express from 'express';
import { GetDatabaseByName, Authenticate, CreateAPIKey } from '../controllers/db_controller';
import {hash, randomBytes } from '../utility/hash';
import path from 'path';
import fs from 'fs';
export const router = express.Router();
const apiPath = '/api/v1';
import Octopus from '../api/';

// Check if the API is up to date
const url = "https://raw.githubusercontent.com/Lillious/Octopus-Deploy-API-Wrapper/main/index.ts";
const file = path.join(__dirname, "..", "/api/index.ts");
const server = await fetch(url);
const serverHash = hash(await server.text());
const client = fs.readFileSync(file);
const clientHash = hash(client.toString());

// If the hashes are different, update the API
if (serverHash !== clientHash) {
    const result = await fetch(url);
    const text = await result.text();
    console.log("API is out of date, updating...");
    fs.writeFileSync(file, text);
    console.log("API updated - Please restart the server.");
}

router.post(`/generate-api-key`, (req, res) => {
    if (!req?.headers?.session) return res.status(403).send({
        error: "INVALID_SESSION"
    });

    const db = GetDatabaseByName("users.sqlite");
    const result = Authenticate(db, req.body.username, hash(req.body.password)) as any;

    if (result.length > 0) {
        const key = () => {
            const key = `API-${randomBytes(16)}`.toUpperCase();
            CreateAPIKey(req.body.username.toLowerCase(), key);
            return key;
        }
        res.status(200).send({
            api_key: key()
        });
    } else {
        return res.status(403).redirect('/');
    }
});

// Accounts API
router.get(`${apiPath}/accounts`, async (req, res) => {
    const result = await Octopus.Account.List();
    res.send(result);
});

// Spaces API
router.get(`${apiPath}/spaces`, async (req, res) => {
    const result = await Octopus.Space.List();
    res.send(result);
});

// Deployment API
router.get(`${apiPath}/deployments`, async (req, res) => {
    const result = await Octopus.Deployment.List();
    res.send(result);
});

// Deployment Process API
router.get(`${apiPath}/deployment-processes`, async (req, res) => {
    const result = await Octopus.DeploymentProcess.List();
    res.send(result);
});

// Deployment Target API
router.get(`${apiPath}/deployment-targets`, async (req, res) => {
    if (!req?.query?.id) {
        const result = await Octopus.DeploymentTarget.List();
        return res.send(result);
    }

    try {
        const result = await Octopus.DeploymentTarget.Find(req.query.id as string);
        return res.status(200).send(result);
    } catch (error) {
        return res.status(400).send({
            error: error
        });
    }
});

// Upgrade Deployment Target
router.post(`${apiPath}/deployment-target-upgrade`, async (req, res) => {
    if (!req?.body?.id) return res.status(400).send({
        error: "ID is required"
    });

    if (!req?.body?.space) return res.status(400).send({
        error: "Space is required"
    });

    try {
        const result = await Octopus.DeploymentTarget.Upgrade(req.body.id as string, req.body.space as string);
        return res.status(200).send(result);
    } catch (error) {
        return res.status(400).send({
            error: error
        });
    }
});

router.get(`${apiPath}/deployment-history`, async (req, res) => {
    if (!req?.query?.id) return res.status(400).send({
        error: "ID is required"
    });

    if (!req?.query?.space) return res.status(400).send({
        error: "Space is required"
    });

    const result = await Octopus.DeploymentProcess.Find(req.query.id as string, req.query.space as string);
    res.send(result);
});

// Tasks API
router.get(`${apiPath}/deployment-tasks`, async (req, res) => {
    if (!req?.query?.id) return res.status(400).send({
        error: "ID is required"
    });

    const result = await Octopus.Task.List(req.query.id as string);
    res.send(result);
});

// Create Task
router.post(`${apiPath}/deployment-task`, async (req, res) => {
    if (!req?.body?.task) return res.status(400).send({
        error: "Task is required"
    });

    const result = await Octopus.Task.Create(req.body.task);
    res.send(result);
});

// Re-run Task
router.post(`${apiPath}/deployment-task-rerun`, async (req, res) => {
    if (!req?.body?.id) return res.status(400).send({
        error: "ID is required"
    });

    const result = await Octopus.Task.ReRun(req.body.id as string);
    res.send(result);
});

// Environment API
router.get(`${apiPath}/environments`, async (req, res) => {
    const result = await Octopus.Environment.List();
    res.send(result);
});

// Event API
router.get(`${apiPath}/events`, async (req, res) => {
    const result = await Octopus.Event.List();
    res.send(result);
});

// Feed API
router.get(`${apiPath}/feeds`, async (req, res) => {
    const result = await Octopus.Feed.List();
    res.send(result);
});

// Connection API
//CheckConnection with query params for id
router.get(`${apiPath}/check-connection`, async (req, res) => {
    try {
        if (!req?.query?.id) return res.status(400).send({
            error: "ID is required"
        });

        const result = await Octopus.Connection.Check(req.query.id as string);
        return res.status(200).send(result);
    } catch (error) {
        return res.status(400).send({
            error: error
        });
    }
});