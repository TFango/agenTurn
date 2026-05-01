import { sequelize } from "./connection";

async function main() {
  await sequelize.authenticate();
  console.log("Conexion exitosa");
  await sequelize.close();
}

main();
