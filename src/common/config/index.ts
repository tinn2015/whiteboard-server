import commonConfig from './common';
import development from './env/development';
import production from './env/production';

const configs = {
  development,
  production,
};

const env = process.env.NODE_ENV || 'development';

export default () => ({
  ...commonConfig,
  ...configs[env],
});
