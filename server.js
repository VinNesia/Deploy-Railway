const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API routes
app.use('/api/save-json', require('./api/save-json'));
app.use('/api/load-json', require('./api/load-json'));

app.listen(process.env.PORT || 3000, () => {
    console.log('Server running on port ' + (process.env.PORT || 3000));
});
