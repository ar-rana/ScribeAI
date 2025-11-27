import { Server } from "socket.io";
import z from "zod";
import { geminiModel } from "../services/geminiAI.js";
import ampq from "amqplib";

const ZAudioData = z.object({
  audio: z.string(),
  client_id: z.string(),
  user: z.string(),
  final: z.string().optional()
});

const rabbitURL = process.env.RABBIT_MQ_URL || "amqp://localhost:5672";
const Q = "audio-chunk";

class SocketService {
  private _io: Server;
  private mq: any;
  private channel: any;

  constructor() {
    console.log("Init Socket Server");
    this._io = new Server({
      cors: {
        allowedHeaders: ["*"],
        origin: "http://localhost:3000",
      },
    });
  }

  public initListner() {
    const io = this.io;
    console.log("Init Socket listners...");

    io.on("connect", (socket) => {
      console.log("New socket connected: ", socket.id);

      socket.on("check", async ({ message }: { message: String }) => {
        console.log("Message from client: ", message);
        socket.emit("check_response", { message: "received message" });
      });

      socket.on("audio", async ({ message }) => {
        const audioData = ZAudioData.parse(message);
        if (audioData.client_id === "NIL") {
          console.log("CLIENT_ID = NIL");
          return;
        };
        console.log("Audio from client: ", audioData.client_id + " " + audioData.user + " " + audioData.audio.slice(0, 21));

        if (audioData.audio.startsWith("data:")) {
          audioData.audio = audioData.audio.split(",")[1] as string;
        }
        this.sendToMQ(audioData);
        socket.emit("audio_received", { message: "received message" });
      });

      this.channel?.consume(Q, async (msg: any) => {
        const content = msg.content.toString();
        // console.log(`Received: ${content.slice(0, 50)} ..................  ${content.slice(content.length - 100, content.length)}`);
        const audioData = ZAudioData.parse(JSON.parse(content));

        const promptConfig = [
          {
            text: "You are a Transcript Agent. You Job is to ONLY return the transcription of the provided Audio. If you do not recognize the audio JUST return 'NIL'",
          },
          {
            inlineData: {
              mimeType: "audio/webm",
              data: audioData.audio,
            },
          },
        ];

        const result = await geminiModel.generateContent({
          contents: [{ role: "user", parts: promptConfig }],
        });

        const response = await result.response;
        console.log("transcript response: ", response.text());

        const data = {
          transcript: response.text(),
          client_id: audioData.client_id,
          user: audioData.user
        } as any;
        if (audioData.final) data.final = true;
        console.log("gemini data: ", data);
        socket.emit("transciption", { message: data });

        this.channel.ack(msg);
      }, { noAck: false });
    });
  }

  public async connectToMQ() {
    try {
      this.mq = await ampq.connect(rabbitURL);
      this.channel = await this.mq.createChannel();
      await this.channel.assertQueue(Q, { durable: true });
      console.log("RabbitMQ connected");
    } catch (e) {
      console.log("error: ", e);
    }
  }

  public async sendToMQ(payload: any) {
    console.log("payload: ", payload);
    this.channel.sendToQueue(Q, Buffer.from(JSON.stringify(payload)));
    console.log("sent: ", JSON.stringify(payload));
  }

  get io() {
    return this._io;
  }
}

export default SocketService;
