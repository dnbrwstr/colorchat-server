import Sequelize from 'sequelize';
import chalk from 'chalk';

const logger = process.env.NODE_ENV ==='production' ? 
  false : 
  msg => console.log(chalk.grey(msg));

const db = new Sequelize(process.env.DATABASE_URL, {
  logging: logger
});

export default db;
