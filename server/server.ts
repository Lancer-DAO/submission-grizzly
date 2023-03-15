import express from 'express';
import dotenv from 'dotenv/config';
import cors from 'cors';
import { auth, data, health } from "./src/routes";

dotenv;
const app = express();

const port = process.env.PORT;

app.use(cors())
app.use(express.json());

app.use("/data", data);
app.use("/health", health);
app.use("/", auth);

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
