import { DataSource } from "typeorm";
require('dotenv').config();


export const AppDataSource = new DataSource({
    "type": "mongodb",
    "url": process.env.MONGODB_URL,
    "database": "node_main_app",
    "synchronize": true,
    "logging": true,
    "entities": [
        "src/entity/*.js"
    ]
});
