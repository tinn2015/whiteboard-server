import commonConfig from './common';
import development from './env/development';
import production from './env/production';
import productioncompose from './env/productioncompose';
import local from './env/local';

const configs = {
  development,
  production,
  local,
  productioncompose,
};

const env = process.env.RUNNING_ENV || 'local';
console.log('====env====', process.env.RUNNING_ENV, env, configs);
export default () => ({
  ...commonConfig,
  ...configs[env],
});
