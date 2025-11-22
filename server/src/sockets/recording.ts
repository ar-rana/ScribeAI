import { Server } from "socket.io";

class SocketService {
  private _io : Server;

  constructor() {
    console.log("Init Socket Server");
    this._io = new Server({
      cors : {
        allowedHeaders : ["*"],
        origin: "http://localhost:3000"
      }
    });
  }

  public initListner() {
    const io = this.io;
    console.log("Init Socket listners...");

    io.on('connect', (socket)=> {
      console.log("New socket connected: ", socket.id);

      socket.on('check', async({message} : {message : String}) => {
        console.log("Message from client: ", message);
      })
    })
  }

  get io() {
    return this._io;
  }

}

export default SocketService;