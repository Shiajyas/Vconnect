import mongoose, { ConnectOptions } from "mongoose";
import dotenv from "dotenv";


dotenv.config();

class Database {
  private uri: string;
  private options: ConnectOptions;
  static connect: any;

  constructor() {
    this.uri = process.env.MONGODB_URL || "mongodb+srv://shijayzoro:bREsiivT9XpjWmbG@circlify.2dub3.mongodb.net/?retryWrites=true&w=majority";
    this.options = {}; 
  }

  public async connect(): Promise<void> {
    try {
      await mongoose.connect(this.uri, this.options);
      console.log("Database Connected!!");
    } catch (err: unknown) {
      console.error("Database connection error:", err);
      process.exit(1); // Exit process with failure
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log("Database Disconnected!!");
    } catch (err: unknown) {
      console.error("Database disconnection error:", err);
    }
  }
}

export default new Database;
