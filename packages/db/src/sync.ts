import dotenv from 'dotenv'
dotenv.config()

import { sequelize } from './connection'
import './models/associations'

async function main() {
  await sequelize.sync({ alter: true })
  console.log('Tablas creadas correctamente')
  await sequelize.close()
}

main()
