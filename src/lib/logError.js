import chalk from 'chalk';

let logError = err => {
  if (err.message) console.log(chalk.red(err.message));
  console.log(chalk.red(err.stack));
};

export default logError;
