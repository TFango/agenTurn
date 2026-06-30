import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { Sequelize } from "sequelize";

let _sequelize: Sequelize | null = null;

export const sequelize = new Proxy({} as Sequelize, {
  get(_target, prop) {
    if (!_sequelize) {
      _sequelize = new Sequelize(process.env.DATABASE_URL!, {
        dialect: "postgres",
        dialectOptions: {
          ssl: { require: true },
        },
      });
    }
    return (_sequelize as any)[prop];
  },
});
