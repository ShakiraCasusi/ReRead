require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB Connection...\n');
console.log('URI:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('✅ CONNECTION SUCCESSFUL!');
        console.log('Connected to:', mongoose.connection.host);
        console.log('Database:', mongoose.connection.name);
        process.exit(0);
    })
    .catch((err) => {
        console.log('❌ CONNECTION FAILED');
        console.log('Error:', err.message);
        console.log('Code:', err.code);
        process.exit(1);
    });
