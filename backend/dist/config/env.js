"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = validateEnv;
exports.getEnv = getEnv;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    // Server
    PORT: zod_1.z.string().default('5000'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    // Supabase
    SUPABASE_URL: zod_1.z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: zod_1.z.string().min(1),
    SUPABASE_ANON_KEY: zod_1.z.string().min(1),
    // Stripe
    PLATFORM_FEE_PERCENT: zod_1.z.string().default('15'),
    // CORS
    ALLOWED_ORIGINS: zod_1.z.string().default('http://localhost:3000'),
    // Socket.io
    SOCKET_CORS_ORIGIN: zod_1.z.string().default('http://localhost:3000'),
});
let env;
function validateEnv() {
    try {
        env = envSchema.parse(process.env);
        return env;
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            console.error('❌ Environment validation failed:');
            error.errors.forEach((err) => {
                console.error(`  - ${err.path.join('.')}: ${err.message}`);
            });
            process.exit(1);
        }
        throw error;
    }
}
function getEnv() {
    if (!env) {
        env = validateEnv();
    }
    return env;
}
//# sourceMappingURL=env.js.map