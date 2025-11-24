import { auth } from "./auth.js";
import { fromNodeHeaders } from "better-auth/node";
import type { Request, NextFunction, Response } from "express";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });
    if (!session || !session.user) {{
        return res.status(401).json({ error: "Unauthorized user" });
    }}
    next();
}
