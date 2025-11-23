import http from 'http'
import express from "express";
import cors from "cors";
import SocketService from "./sockets/recording.js";
import z from 'zod';
import prismaClient from './services/prisma.js';

const app = express();
const port = 3333;

const corsOptions = {
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
  origin: "http://localhost:3000",
  methods: "GET,POST,DELETE,PUT",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is Online!");
});

app.post("/user/login", async (req, res) => {
  try {
    const zdata = loginPayloadSchema.parse(req.body);
    const user = await prismaClient.users.create({
      data: {
        name : zdata.name,
        email : zdata.email
      },
    });
    res.status(200).json({ message: "User saved", user: user.email });
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ error: error.message || "Invalid Input" });
  }
});

app.post("/transcript", async (req, res) => {
  try {
    const zdata = transcriptPayload.parse(req.body);
    const user = await prismaClient.transcripts.find({
      data: {
        name : zdata.name,
        email : zdata.email
      },
    });
    res.status(200).json({ message: "User saved", user: user.email });
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ error: error.message || "Invalid Input" });
  }
});

app.get("/summary/:id", async (req, res) => {
  const { id } = req.params;
  try {
    console.log("received");
    res.status(200).json({ message: `Hello ${id}` });
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ error: error.message || "Invalid Input" });
  }
});



async function init() {
  const socketService = new SocketService();

  const httpServer = http.createServer(app);
  socketService.io.attach(httpServer);

  httpServer.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });

  socketService.initListner();
}

init();

const loginPayloadSchema = z.object({
  email: z.email(),
  name: z.string(),
});

const transcriptPayload = z.object({
  email: z.email(),
  name: z.string(),
});

