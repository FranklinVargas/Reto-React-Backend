import { Router } from "express";
import { z } from "zod";
import { Product } from "../models/index.js";

const router = Router();
const productSchema = z.object({
  name: z.string().min(1),
  unitPrice: z.number().positive()
});

router.get("/", async (_req, res, next) => {
  try { res.json(await Product.findAll({ order: [["id","ASC"]] })); }
  catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    const data = productSchema.parse({
      name: req.body.name,
      unitPrice: Number(req.body.unitPrice)
    });
    const created = await Product.create(data);
    res.status(201).json(created);
  } catch (e) { next(e); }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = productSchema.parse({
      name: req.body.name,
      unitPrice: Number(req.body.unitPrice)
    });
    const prod = await Product.findByPk(id);
    if (!prod) return res.status(404).json({ message: "Product not found" });
    await prod.update(data);
    res.json(prod);
  } catch (e) { next(e); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const prod = await Product.findByPk(id);
    if (!prod) return res.status(404).json({ message: "Product not found" });
    await prod.destroy();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
