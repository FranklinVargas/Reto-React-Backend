import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

export class Product extends Model {}
Product.init(
  {
    name: { type: DataTypes.STRING, allowNull: false },
    unitPrice: { type: DataTypes.DECIMAL(10,2), allowNull: false }
  },
  { sequelize, modelName: "Product", tableName: "products", timestamps: true }
);
