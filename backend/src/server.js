import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { syncModels } from "./models/index.js";
import productsRouter from "./routes/products.js";
import ordersRouter from "./routes/orders.js";
import { errorHandler } from "./middlewares/error.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.json({ ok: true, name: "Tech Test API" }));
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

(async () => {
  await connectDB();
  await syncModels();
  app.listen(PORT, () => console.log(`🚀 API escuchando en http://localhost:${PORT}`));
})();
