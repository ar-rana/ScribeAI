import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { fromNodeHeaders } from "better-auth/node";
import type { Request } from "express";
import prismaClient from "./services/prisma.js";

export const auth = betterAuth({
    database: prismaAdapter(prismaClient, {
        provider: "postgresql",
    }),
    trustedOrigins: [
        "http://localhost:3333",
        "http://localhost:3000",
    ],
    emailAndPassword: { 
        enabled: false, 
    }, 
    socialProviders: { 
        google: { 
            prompt: "select_account",
            clientId: process.env.GOOGLE_CLIENT_ID as string, 
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
        }, 
    }, 
});


export const getAuthContext = async (headers: Request["headers"]) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(headers),
    });
    return session;
}
