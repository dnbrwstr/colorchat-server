import Sequelize from 'sequelize';
import chalk from 'chalk';

export default new Sequelize(process.env.DATABASE_URL, {
  logging: msg => console.log(chalk.grey(msg))
});
