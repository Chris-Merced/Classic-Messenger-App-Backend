"use strict";
const { Pool } = require('pg');
const config = require('../config');
try {
    const pool = new Pool(config);
    module.exports = pool;
}
catch (err) {
    console.error('Error creating pool:', err);
    throw err;
}
//# sourceMappingURL=pool.js.map