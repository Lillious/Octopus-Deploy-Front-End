import { ClearInactiveSession } from "../controllers/db_controller.ts";
const job = {
    clearInactiveSessions: {
        name: 'clearInactiveSessions',
        interval: 3.6e+6,
        callback: () => {
            console.log(`Running job: ${job.clearInactiveSessions.name}`);
            ClearInactiveSession();
        }
    }
} as { [key: string]: { name: string, interval: number, callback: () => void } };

Object.keys(job).forEach((key) => {
    // Start the job
    job[key].callback();
    // Schedule the job
    setInterval(job[key].callback, job[key].interval);
});