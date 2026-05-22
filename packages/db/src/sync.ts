import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { sequelize } from './connection'
import './models/associations'

async function main() {
  await sequelize.sync({ force: true })
  console.log('Tablas creadas correctamente')
  await sequelize.close()
}

main()
