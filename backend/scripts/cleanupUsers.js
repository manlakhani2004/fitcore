require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const result = await db.collection('users').deleteMany({
    email: { $nin: ['anjalisutariya232@gmail.com', 'manblakhani@gmail.com', 'bhargavi@gmail.com'] }
  });
  console.log('Deleted ' + result.deletedCount + ' users');
  const remaining = await db.collection('users').countDocuments();
  console.log('Remaining users: ' + remaining);
  mongoose.disconnect();
}).catch(err => { console.error(err); process.exit(1); });
