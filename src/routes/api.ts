import express from 'express';
import { GetDatabaseByName, Authenticate, CreateAPIKey, ValidateAPIKey } from '../controllers/db_controller';
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
if (!server.ok) throw new Error("Unable to fetch API");
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
    /**
     * @openapi
     * /generate-api-key:
     *  post:
     *      tags:
     *      - Default
     *      description: Generate an API Key
     *      responses:
     *          200:
     *              description: API Key generated successfully
     *          403:
     *              description: Invalid session
     *          400:
     *              description: Invalid credentials
     */
    if (!req?.headers?.session) return res.status(403).send({
        error: "INVALID_SESSION"
    });

    if (!req?.body?.username || !req?.body?.password) return res.status(403).send({
        error: "INVALID_CREDENTIALS"
    });

    if (!req?.body?.access_level) return res.status(403).send({
        error: "INVALID_ACCESS_LEVEL"
    });

    const db = GetDatabaseByName("users.sqlite");
    const result = Authenticate(db, req.body.username, hash(req.body.password)) as any;

    if (result.length > 0) {
        const key = () => {
            const key = `API-${randomBytes(16)}`.toUpperCase();
            CreateAPIKey(req.body.username.toLowerCase(), key, req.body.access_level);
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
    /**
     * @openapi
     * '/api/v1/accounts':
     *  get:
     *      description: Get a list of accounts
     *      tags:
     *      - Accounts
     *      responses:
     *          200:
     *              description: List of accounts
     *          400:
     *              description: Invalid credentials
     *          403:
     *              description: Invalid session
     *          500:
     *              description: Internal server error
     */
    const result = await Octopus.Account.List();
    res.send(result);
});

// Spaces API
router.get(`${apiPath}/spaces`, async (req, res) => {
    /**
     * @openapi
     * '/api/v1/spaces':
     *  get:
     *      description: Get a list of spaces
     *      tags:
     *      - Spaces
     *      responses:
     *          200:
     *              description: List of spaces
     *          400:
     *              description: Invalid credentials
     *          403:
     *              description: Invalid session
     *          500:
     *              description: Internal server error
     */
    const result = await Octopus.Space.List();
    res.send(result);
});

// Deployment API
router.get(`${apiPath}/deployments`, async (req, res) => {
    /**
     * @openapi
     * '/api/v1/deployments':
     *  get:
     *      description: Get a list of deployments
     *      tags:
     *      - Deployments
     *      responses:
     *          200:
     *              description: List of deployments
     *          400:
     *              description: Invalid credentials
     *          403:
     *              description: Invalid session
     *          500:
     *              description: Internal server error
     */
    const result = await Octopus.Deployment.List();
    res.send(result);
});

// Deployment Process API
router.get(`${apiPath}/deployment-processes`, async (req, res) => {
    /**
     * @openapi
     * '/api/v1/deployment-processes':
     *  get:
     *      description: Get a list of deployment processes
     *      tags:
     *      - Deployment Target
     *      responses:
     *          200:
     *              description: List of deployment processes
     *          400:
     *              description: Invalid credentials
     *          403:
     *              description: Invalid session
     *          500:
     *              description: Internal server error
     */
    const result = await Octopus.DeploymentProcess.List();
    res.send(result);
});

// Deployment Target API
router.get(`${apiPath}/deployment-targets`, async (req, res) => {
    /**
     * @openapi
     * '/api/v1/deployment-targets':
     *  get:
     *      description: Get a list of deployment targets
     *      tags:
     *      - Deployment Target
     *      responses:
     *          200:
     *              description: List of deployment targets
     *          400:
     *              description: Invalid credentials
     *          403:
     *              description: Invalid session
     *          500:
     *              description: Internal server error
     */
    if (!req?.query?.id) {
        const result = await Octopus.DeploymentTarget.List();
        return res.send(result);
    }

    /**
     * @openapi
     * '/api/v1/deployment-targets{id}':
     *  get:
     *      description: Get a list of deployment targets by ID
     *      tags:
     *      - Deployment Target
     *      responses:
     *          200:
     *              description: List of deployment targets
     *          400:
     *              description: Invalid credentials
     *          403:
     *              description: Invalid session
     *          500:
     *              description: Internal server error
     */
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
    /**
     * @openapi
     * '/api/v1/deployment-target-upgrade{id}{space}':
     *  post:
     *      description: Upgrade a deployment target
     *      tags:
     *      - Deployment Target
     *      responses:
     *          200:
     *              description: Deployment target upgraded successfully
     *          400:
     *              description: Invalid credentials
     *          403:
     *              description: Invalid session
     *          500:
     *              description: Internal server error
     */

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
    /**
     * @openapi
     * '/api/v1/deployment-history{id}{space}':
     *  get:
     *      description: Get a list of deployment history
     *      tags:
     *      - Deployment Target
     *      responses:
     *          200:
     *              description: List of deployment history
     *          400:
     *              description: Invalid credentials
     *          403:
     *              description: Invalid session
     *          500:
     *              description: Internal server error
     */
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
    /**
     * @openapi
     * '/api/v1/deployment-tasks{id}':
     *  get:
     *      description: Get a list of deployment tasks
     *      tags:
     *      - Tasks
     *      responses:
     *          200:
     *              description: List of deployment tasks
     *          400:
     *              description: Invalid credentials
     *          403:
     *              description: Invalid session
     *          500:
     *              description: Internal server error
     */
    if (!req?.query?.id) return res.status(400).send({
        error: "ID is required"
    });

    const result = await Octopus.Task.List(req.query.id as string);
    res.send(result);
});

// Create Task
router.post(`${apiPath}/deployment-task`, async (req, res) => {
    /**
     * @openapi
     * '/api/v1/deployment-task{task}':
     *  post:
     *      description: Create a deployment task
     *      tags:
     *      - Tasks
     *      responses:
     *          200:
     *              description: Deployment task created successfully
     *          400:
     *              description: Invalid credentials
     *          403:
     *              description: Invalid session
     *          500:
     *              description: Internal server error
     */

    if (!req?.body?.task) return res.status(400).send({
        error: "Task is required"
    });

    const result = await Octopus.Task.Create(req.body.task);
    res.send(result);
});

// Re-run Task
router.post(`${apiPath}/deployment-task-rerun`, async (req, res) => {
    /**
     * @openapi
     * '/api/v1/deployment-task-rerunP{id}':
     *  post:
     *      description: Re-run a deployment task
     *      tags:
     *      - Tasks
     *      responses:
     *          200:
     *              description: Deployment task re-run successfully
     *          400:
     *              description: Invalid credentials
     *          403:
     *              description: Invalid session
     *          500:
     *              description: Internal server error
     */
    if (!req?.body?.id) return res.status(400).send({
        error: "ID is required"
    });

    const result = await Octopus.Task.ReRun(req.body.id as string);
    res.send(result);
});

// Environment API
router.get(`${apiPath}/environments`, async (req, res) => {
    /**
     * @openapi
     * '/api/v1/environments':
     *  get:
     *      description: Get a list of environments
     *      tags:
     *      - Environments
     *      responses:
     *          200:
     *              description: List of environments
     *          400:
     *              description: Invalid credentials
     *          403:
     *              description: Invalid session
     *          500:
     *              description: Internal server error
     */
    const result = await Octopus.Environment.List();
    res.send(result);
});

// Event API
router.get(`${apiPath}/events`, async (req, res) => {
    /**
     * @openapi
     * '/api/v1/events':
     *  get:
     *      description: Get a list of events
     *      tags:
     *      - Events
     *      responses:
     *          200:
     *              description: List of events
     *          400:
     *              description: Invalid credentials
     *          500:
     *              description: Internal server error
     */
    const result = await Octopus.Event.List();
    res.send(result);
});

// Feed API
router.get(`${apiPath}/feeds`, async (req, res) => {
    /**
     * @openapi
     * '/api/v1/feeds':
     *  get:
     *      description: Get a list of feeds
     *      tags:
     *      - Feeds
     *      responses:
     *          200:
     *              description: List of feeds
     *          400:
     *              description: Invalid credentials
     *          500:
     *              description: Internal server error
     */
    const result = await Octopus.Feed.List();
    res.send(result);
});

// Connection API
router.get(`${apiPath}/check-connection`, async (req, res) => {
    /**
     * @openapi
     * '/api/v1/check-connection{id}':
     *  get:
     *      description: Check a connection
     *      tags:
     *      - Deployment Target
     *      responses:
     *          200:
     *              description: Connection checked successfully
     *          400:
     *              description: Invalid ID
     *          500:
     *              description: Internal server error
     */
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