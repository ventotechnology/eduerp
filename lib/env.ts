import 'dotenv/config';

export const ENV = {
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://humayun@localhost:5432/eduerp_dev',
  NEXT_PUBLIC_APP_DOMAIN: process.env.NEXT_PUBLIC_APP_DOMAIN || 'eduerp.us',
  NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'eduerp.us',
  AUTH_SECRET: process.env.AUTH_SECRET || 'eduerp_default_auth_secret_dev_32b',
  SESSION_EXPIRY_DAYS: parseInt(process.env.SESSION_EXPIRY_DAYS || '7', 10),
  ENABLE_DEMO_SIMULATORS: process.env.ENABLE_DEMO_SIMULATORS !== 'false',
  IS_PRODUCTION: process.env.NODE_ENV === 'production'
};
