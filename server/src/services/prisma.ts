import { PrismaClient } from "../generated/prisma/client/index.js";

const prismaClient = new PrismaClient({
    log: ["query"],
});

export default prismaClient;

export const DOCKER_DB = "postgresql://root:myperfectpassword@localhost:5433/SCRIBEAI_DB";

// npx @better-auth/cli migrate

// npx prisma migrate dev --name init
// npx prisma generate