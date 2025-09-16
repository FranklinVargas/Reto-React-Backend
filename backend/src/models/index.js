import { sequelize } from "../config/db.js";
import { Product } from "./Product.js";
import { Order } from "./Order.js";
import { OrderItem } from "./OrderItem.js";

// Relaciones: Order <-> Product (N:M) via OrderItem
Order.belongsToMany(Product, { through: OrderItem, foreignKey: "orderId" });
Product.belongsToMany(Order, { through: OrderItem, foreignKey: "productId" });

// También llaves directas para includes:
OrderItem.belongsTo(Order, { foreignKey: "orderId" });
OrderItem.belongsTo(Product, { foreignKey: "productId" });
Order.hasMany(OrderItem, { foreignKey: "orderId" });
Product.hasMany(OrderItem, { foreignKey: "productId" });

export async function syncModels() {
  await sequelize.sync({ alter: true }); // en dev; en prod usa migrations
}

export { Product, Order, OrderItem };
