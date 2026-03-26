"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeCronJobs = initializeCronJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const dispatchService_1 = require("./dispatchService");
/**
 * Initialize cron jobs
 */
function initializeCronJobs() {
    // Run dispatch service every 30 minutes
    node_cron_1.default.schedule('*/30 * * * *', async () => {
        console.log('[Cron] Running scheduled dispatch service...');
        await (0, dispatchService_1.dispatchHighUrgencyJobs)();
    });
    console.log('[Cron] Cron jobs initialized');
    console.log('  - High-urgency job dispatch: Every 30 minutes');
}
//# sourceMappingURL=cronService.js.map