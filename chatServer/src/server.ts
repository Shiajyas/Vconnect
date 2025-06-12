import App from "./app/server";
import Database from "./infrastructure/config/dbConnection";

let port = parseInt(process.env.PORT || "3009");

(async () => {
  await Database.connect();
  const app = new App(port);
  app.start(); 
})();
   