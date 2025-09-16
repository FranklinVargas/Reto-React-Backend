import { connectDB } from "./config/db.js";
import { syncModels, Product } from "./models/index.js";

(async () => {
  await connectDB();
  await syncModels();

  await Product.destroy({ where: {} });

  await Product.bulkCreate([
    { name: "Laptop 14\"", unitPrice: 2500.00 },
    { name: "Mouse Inalámbrico", unitPrice: 80.00 },
    { name: "Teclado Mecánico", unitPrice: 350.00 }
  ]);

  console.log("✅ Seed listo");
  process.exit(0);
})();
