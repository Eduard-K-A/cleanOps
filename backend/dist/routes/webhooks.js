"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const payment_1 = __importDefault(require("../config/payment"));
// import { getEnv } from '../config/env';
const supabase_1 = require("../config/supabase");
const router = (0, express_1.Router)();
const supabase = (0, supabase_1.getSupabaseAdmin)();
/**
 * Stripe webhook endpoint
 * Handles payment events
 */
router.post('/stripe', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
    // For the mock payment provider we do not enforce signatures; parse body.
    let event;
    try {
        event = payment_1.default.constructEvent(req.body, undefined, undefined);
    }
    catch (err) {
        console.error('Webhook parse failed:', err.message);
        return res.status(400).json({
            success: false,
            error: `Webhook Error: ${err.message}`,
            code: 400,
        });
    }
    // Handle the event
    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                console.log('PaymentIntent succeeded:', event.data.object.id);
                // Payment captured successfully
                break;
            case 'payment_intent.payment_failed':
                console.log('PaymentIntent failed:', event.data.object.id);
                // Handle failed payment
                break;
            case 'transfer.created':
                console.log('Transfer created:', event.data.object.id);
                // Transfer to worker account created
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).json({
            success: false,
            error: 'Webhook handler failed',
            code: 500,
        });
    }
});
exports.default = router;
//# sourceMappingURL=webhooks.js.map