import { Entity, ObjectIdColumn, Column } from "typeorm"

@Entity()
export class Product {
    @ObjectIdColumn()
    id: string;

    @Column({unique: true})
    admin_id: number;

    @Column()
    title: string;

    @Column()
    image: string;

    @Column()
    likes: number;
}