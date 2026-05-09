const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      console.log('✅ Admin already exists:', existing.email);
      process.exit();
    }

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);

    const admin = new User({
      name: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      password,
      role: 'admin'
    });

    await admin.save();
    console.log('✅ Admin account created!');
    console.log('   Name :', process.env.ADMIN_NAME);
    console.log('   Email:', process.env.ADMIN_EMAIL);
    process.exit();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

seedAdmin();