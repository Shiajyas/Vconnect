
import App from "./src/app/server"
import Database from "./src/infrastructure/config/dbConnection"

let port =  parseInt(process.env.PORT || "3009");



(async () => {
    await Database.connect()
    const app = new App(port)
    await app.start()
  
  })()