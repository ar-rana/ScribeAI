import http from 'http'
import express from "express";
import cors from "cors";
import SocketService from "./sockets/recording.js";
import z from 'zod';
import prismaClient from './services/prisma.js';
import { generateSummary } from './services/geminiAI.js';
import { authMiddleware } from './middleware.js';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import { auth } from './auth.js';

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

app.all('/api/auth/{*any}', toNodeHandler(auth));
app.get("/api/me", async (req, res) => {
    const session = await auth.api.getSession({
     headers: fromNodeHeaders(req.headers),
   });
   return res.json(session);
});

app.get("/", (req, res) => {
  res.send("Server is Online!");
});

app.get("/a", authMiddleware, (req, res) => {
  res.send("Server is Online and Protected!!");
});

app.get("/dashboard", (req, res) => {
  res.redirect("http://localhost:3000/dashboard");
});

app.post("/user/recording", async (req, res) => { // used
  try {
    const zdata = recording.parse(req.body);
    console.log("record data: ", zdata);
    const recordingData = await prismaClient.transcripts.create({
      data: {
        userEmail: zdata.email,
        transcript: zdata.transcript,
        title: zdata.title as string,
        duration: zdata.duration,
        client_audio_id: zdata.client_audio_id
      },
    });
    res.status(200).json({ message: `Recording Saved ${recordingData.id}` });
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ error: error.message || "Invalid Input" });
  }
});

app.post("/transcript", async (req, res) => {
  try {
    const zdata = transcriptPayload.parse(req.body);
    const transcript = await prismaClient.transcripts.findFirst({
      where: {
        userEmail: zdata.email,
        client_audio_id: zdata.client_id
      },
    });
    res.status(200).json({ transcript: transcript });
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ error: error.message || "Invalid Input" });
  }
});

app.post("/summary", authMiddleware, async (req, res) => { // used
  try {
    const zdata = transcriptPayload.parse(req.body);
    const transcript = await prismaClient.transcripts.findFirst({
      where: {
        userEmail: zdata.email,
        client_audio_id: zdata.client_id
      },
    });

    let response: string = "";
    if (transcript) response = await generateSummary(transcript.transcript);
    console.log("summary: ", response);
    res.status(200).json({ summary: response });
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ error: error.message || "Invalid Input" });
  }
});

app.get("/list/:email", authMiddleware, async (req, res) => { // used
  const { email } = req.params;
  try {
    const transcripts = await prismaClient.transcripts.findMany({
      where: {
        userEmail: email as string,
      },
    });
    res.status(200).json({ recordings: transcripts });
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
  client_id: z.string(),
});

const recording = z.object({
  email: z.email(),
  transcript: z.string(),
  title: z.string().optional(),
  duration: z.string(),
  client_audio_id: z.string()
});

