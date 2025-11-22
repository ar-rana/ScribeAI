import http from 'http'
import express from "express";
import cors from "cors";
import SocketService from "./sockets/recording.js";

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
