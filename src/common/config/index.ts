import commonConfig from './common';
import development from './env/development';
import production from './env/production';
import productioncompose from './env/productioncompose';
import productionCluster from './env/productionCluster';
import local from './env/local';

const configs = {
  development,
  production,
  local,
  productioncompose,
  productionCluster,
};

const env = process.env.RUNNING_ENV || 'local';
console.log('====env====', process.env.RUNNING_ENV, env, configs);
export default () => ({
  ...commonConfig,
  ...configs[env],
});
