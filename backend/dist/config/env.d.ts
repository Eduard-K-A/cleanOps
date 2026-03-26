import { z } from 'zod';
declare const envSchema: z.ZodObject<{
    PORT: z.ZodDefault<z.ZodString>;
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    SUPABASE_URL: z.ZodString;
    SUPABASE_SERVICE_ROLE_KEY: z.ZodString;
    SUPABASE_ANON_KEY: z.ZodString;
    PLATFORM_FEE_PERCENT: z.ZodDefault<z.ZodString>;
    ALLOWED_ORIGINS: z.ZodDefault<z.ZodString>;
    SOCKET_CORS_ORIGIN: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    PORT: string;
    NODE_ENV: "development" | "production" | "test";
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    SUPABASE_ANON_KEY: string;
    PLATFORM_FEE_PERCENT: string;
    ALLOWED_ORIGINS: string;
    SOCKET_CORS_ORIGIN: string;
}, {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    SUPABASE_ANON_KEY: string;
    PORT?: string | undefined;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    PLATFORM_FEE_PERCENT?: string | undefined;
    ALLOWED_ORIGINS?: string | undefined;
    SOCKET_CORS_ORIGIN?: string | undefined;
}>;
export type Env = z.infer<typeof envSchema>;
export declare function validateEnv(): Env;
export declare function getEnv(): Env;
export {};
//# sourceMappingURL=env.d.ts.map