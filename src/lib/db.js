import Sequelize from 'sequelize';
import chalk from 'chalk';

let db = new Sequelize(process.env.DATABASE_URL, {
  logging: msg => console.log(chalk.grey(msg))
});

export default db;