import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

export const ORDER_STATUS = ["Pending", "InProgress", "Completed"];

export class Order extends Model {}
Order.init(
  {
    orderNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    productsCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    finalPrice: { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.ENUM(...ORDER_STATUS), allowNull: false, defaultValue: "Pending" }
  },
  { sequelize, modelName: "Order", tableName: "orders", timestamps: true }
);
