import { PrismaClient } from "../generated/prisma/client/index.js";

const prismaClient = new PrismaClient({
    log: ["query"],
});

export default prismaClient;

// npx prisma migrate dev --name init
// npx prisma generate