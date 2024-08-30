"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
var typeorm_1 = require("typeorm");
require('dotenv').config();
exports.AppDataSource = new typeorm_1.DataSource({
    "type": "mongodb",
    "url": process.env.MONGODB_URL,
    "database": "node_main_app",
    "synchronize": true,
    "logging": true,
    "entities": [
        "src/entity/*.js"
    ]
});
