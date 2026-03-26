"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabaseAdmin = getSupabaseAdmin;
exports.getSupabaseClient = getSupabaseClient;
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("./env");
let supabaseAdmin;
function getSupabaseAdmin() {
    if (!supabaseAdmin) {
        const env = (0, env_1.getEnv)();
        supabaseAdmin = (0, supabase_js_1.createClient)(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }
    return supabaseAdmin;
}
// Client for user-authenticated requests (uses anon key)
function getSupabaseClient(authToken) {
    const env = (0, env_1.getEnv)();
    const client = (0, supabase_js_1.createClient)(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
        global: {
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        },
    });
    return client;
}
//# sourceMappingURL=supabase.js.map