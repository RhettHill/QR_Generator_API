const express = require('express');
const cors = require('cors');
const rapidApiIpWhitelist = require('./Ip-secure'); // path to the file

const app = express();

app.use(cors());
app.use(express.json());

// Use the IP whitelist middleware early
app.use(rapidApiIpWhitelist);

const generateRoute = require('./routes/generate');
app.use('/api/generate', generateRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
