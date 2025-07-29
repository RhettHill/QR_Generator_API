const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();


const app = express();
const PORT = process.env.PORT;
app.use(cors());
app.use(express.json());
const generateRoute = require('./routes/generate');

app.use('/api/generate', generateRoute);


app.get('/', (req, res) => {
  res.send('QR Code API is live. Use POST /api/generate');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
