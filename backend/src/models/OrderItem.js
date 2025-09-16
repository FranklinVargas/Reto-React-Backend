import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

export class OrderItem extends Model {}
OrderItem.init(
  {
    qty: { type: DataTypes.INTEGER, allowNull: false },
    unitPrice: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    totalPrice: { type: DataTypes.DECIMAL(10,2), allowNull: false }
  },
  { sequelize, modelName: "OrderItem", tableName: "order_items", timestamps: true }
);
