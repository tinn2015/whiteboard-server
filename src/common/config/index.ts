import commonConfig from './common';
import development from './env/development';
import production from './env/production';
import local from './env/local';

const configs = {
  development,
  production,
  local,
};

const env = process.env.RUNNING_ENV || 'local';
console.log('====env====', process.env.RUNNING_ENV, env, configs);
export default () => ({
  ...commonConfig,
  ...configs[env],
});
