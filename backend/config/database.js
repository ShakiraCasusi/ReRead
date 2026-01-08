const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        console.log(`📍 URI: ${process.env.MONGODB_URI}`);

        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
        console.log(`✓ Database: ${conn.connection.name}`);
        return conn;
    } catch (error) {
        console.error(`✗ MongoDB Connection Error:`);
        console.error(`   Message: ${error.message}`);
        console.error(`   Code: ${error.code}`);
        console.log('\n💡 Troubleshooting steps:');
        console.log('   1. Copy the exact connection string from MongoDB Atlas');
        console.log('   2. Go to Clusters → Connect → Drivers');
        console.log('   3. Select Node.js driver');
        console.log('   4. Copy the full connection string');
        console.log('   5. Replace <password> with your actual password (no encoding needed)');
        console.log('   6. Paste into .env as MONGODB_URI');
        return null;
    }
};

module.exports = connectDB;
