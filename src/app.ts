import * as express from 'express';
import { Request, Response } from 'express';
import * as cors from 'cors';
import * as amqp from 'amqplib/callback_api';
import axios from 'axios';

import { AppDataSource } from './db';
import { Product } from './entity/product';

require('dotenv').config();


AppDataSource.initialize()
    .then(() => {
        const productRepository = AppDataSource.getMongoRepository(Product);
        amqp.connect(process.env.AMQP_URL, (err, conn) => {
            if (err) throw err;
            conn.createChannel((err, channel) => {
                if (err) throw err;

                channel.assertQueue('product_created', { durable: false });
                channel.assertQueue('product_updated', { durable: false });
                channel.assertQueue('product_deleted', { durable: false });

                const app = express();
                app.use(cors({
                    origin: ['http://localhost:3000', 'http://localhost:8080', 'localhost:4200'],
                }));
        
                app.use(express.json());

                channel.consume('product_created', async (msg) => {
                    const eventProduct: Product = JSON.parse(msg.content.toString());
                    const product = new Product();
                    product.admin_id = parseInt(eventProduct.id);
                    product.title = eventProduct.title;
                    product.image = eventProduct.image;
                    product.likes = eventProduct.likes;
                    await productRepository.save(product);
                    console.log('Product created: ', product);
                }, { noAck: true });

                channel.consume('product_updated', async (msg) => {
                    const eventProduct: Product = JSON.parse(msg.content.toString());
                    const product = await productRepository.findOne({ 
                        where: { admin_id: parseInt(eventProduct.id) }
                    });
                    productRepository.merge(product, {
                        title: eventProduct.title,
                        image: eventProduct.image,
                        likes: eventProduct.likes
                    })
                    await productRepository.save(product);
                    console.log('Product updated: ', product);
                }, { noAck: true });

                channel.consume('product_deleted', async (msg) => {
                    const admin_id = parseInt(msg.content.toString());
                    await productRepository.deleteOne({ admin_id });
                    console.log('Product deleted: ', admin_id);
                }, { noAck: true });

                app.get('/api/products', async (req: Request, res: Response) => {
                    const products = await productRepository.find();
                    return res.json(products);
                });
                
                app.post('/api/products/:id/like', async (req: Request, res: Response) => {
                    const product = await productRepository.findOneBy(req.params.id);
                    await axios.post(`http://localhost:8000/api/products/${product.admin_id}/like`, {});
                    product.likes++;
                    await productRepository.save(product);
                    return res.send(product)
                });

                console.log('Server is running on port 8001')
                app.listen(8001)
                process.on('beforeExit', () => {
                    console.log('Closing');
                    conn.close();
                });
            });
        })
    })
    .catch((error) => console.log('TypeORM connection error: ', error));
