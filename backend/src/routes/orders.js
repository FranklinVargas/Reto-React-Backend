import { Router } from "express";
import { z } from "zod";
import { sequelize } from "../config/db.js";
import { Product, Order, OrderItem } from "../models/index.js";
import { ORDER_STATUS } from "../models/Order.js";

const router = Router();

const itemSchema = z.object({
  productId: z.number().int().positive(),
  qty: z.number().int().positive()
});

const createOrderSchema = z.object({
  orderNumber: z.string().min(1),
  items: z.array(itemSchema).min(1)
});

const updateOrderSchema = z.object({
  orderNumber: z.string().min(1).optional(),
  items: z.array(itemSchema).min(1).optional()
});

router.get("/", async (_req, res, next) => {
  try {
    const orders = await Order.findAll({
      order: [["id","ASC"]],
      include: [{ model: OrderItem, include: [Product] }]
    });
    res.json(orders);
  } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, include: [Product] }]
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { orderNumber, items } = createOrderSchema.parse(req.body);

    // Calcular totales tomando el precio actual del producto
    let productsCount = 0;
    let finalPrice = 0;
    const itemRows = [];

    for (const it of items) {
      const prod = await Product.findByPk(it.productId, { transaction: t });
      if (!prod) throw Object.assign(new Error(`Product ${it.productId} not found`), { status: 400 });
      const unitPrice = Number(prod.unitPrice);
      const totalPrice = unitPrice * it.qty;
      productsCount += it.qty;
      finalPrice += totalPrice;

      itemRows.push({ productId: it.productId, qty: it.qty, unitPrice, totalPrice });
    }

    const order = await Order.create(
      { orderNumber, productsCount, finalPrice, status: "Pending" },
      { transaction: t }
    );

    for (const row of itemRows) {
      await OrderItem.create({ ...row, orderId: order.id }, { transaction: t });
    }

    await t.commit();
    const created = await Order.findByPk(order.id, { include: [{ model: OrderItem, include: [Product] }] });
    res.status(201).json(created);
  } catch (e) {
    await t.rollback();
    next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const id = Number(req.params.id);
    const payload = updateOrderSchema.parse(req.body);
    const order = await Order.findByPk(id, { include: [OrderItem], transaction: t });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status === "Completed") {
      return res.status(400).json({ message: "Completed orders cannot be modified" });
    }

    // Si hay items -> recalcular
    if (payload.items) {
      // borrar items previos
      await OrderItem.destroy({ where: { orderId: id }, transaction: t });

      let productsCount = 0;
      let finalPrice = 0;

      for (const it of payload.items) {
        const prod = await Product.findByPk(it.productId, { transaction: t });
        if (!prod) throw Object.assign(new Error(`Product ${it.productId} not found`), { status: 400 });
        const unitPrice = Number(prod.unitPrice);
        const totalPrice = unitPrice * it.qty;
        productsCount += it.qty;
        finalPrice += totalPrice;

        await OrderItem.create(
          { orderId: id, productId: it.productId, qty: it.qty, unitPrice, totalPrice },
          { transaction: t }
        );
      }

      order.productsCount = productsCount;
      order.finalPrice = finalPrice;
    }

    if (payload.orderNumber) order.orderNumber = payload.orderNumber;

    await order.save({ transaction: t });
    await t.commit();

    const updated = await Order.findByPk(id, { include: [{ model: OrderItem, include: [Product] }] });
    res.json(updated);
  } catch (e) {
    await t.rollback();
    next(e);
  }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!ORDER_STATUS.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${ORDER_STATUS.join(", ")}` });
    }
    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    order.status = status;
    await order.save();
    res.json(order);
  } catch (e) { next(e); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "Completed") {
      return res.status(400).json({ message: "Completed orders cannot be deleted" });
    }
    await OrderItem.destroy({ where: { orderId: id } });
    await order.destroy();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
