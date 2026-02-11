require('./config/env');
const bcrypt = require('bcryptjs');
const app = require('./app');
const config = require('./config/env');
const { connect } = require('./config/database');
const User = require('./models/User');

const SUPERADMIN_EMAIL = 'heathcareadmin@yopmail.com';
const SUPERADMIN_PASSWORD = 'Admin@123';

async function ensureSuperAdmin() {
  const existing = await User.findOne({ email: SUPERADMIN_EMAIL });
  if (existing) return;
  const password_hash = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);
  await User.create({ email: SUPERADMIN_EMAIL, password_hash, role: 'superadmin' });
}

connect()
  .then(() => ensureSuperAdmin())
  .then(() => {
    app.listen(config.port, () => {
      console.log(`Server listening on port ${config.port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
