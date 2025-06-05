import { Order } from './entities/order.entity';
import { User } from '../user/entities/user.entity';
import { Connection } from 'typeorm';

export async function seedData(connection: Connection) {
  // Clear existing data
  await connection.createQueryBuilder().delete().from(Order).execute();
  await connection.createQueryBuilder().delete().from(User).execute();

  // Generate 10,000 orders across last 90 days
  const orders: Partial<Order>[] = [];
  const statuses = ['pending', 'shipped', 'delivered', 'cancelled'];
  const now = new Date();

  for (let i = 0; i < 10000; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    orders.push({
      total: parseFloat((Math.random() * 1000 + 50).toFixed(2)),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: date
    });
  }

  // Generate 1,000 users across last 90 days
  const users: Partial<User>[] = [];
  for (let i = 0; i < 1000; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    users.push({
      username: `user${i}`,
      email: `user${i}@example.com`,
      createdAt: date
    });
  }

  // Batch insert
  await connection
    .createQueryBuilder()
    .insert()
    .into(Order)
    .values(orders)
    .execute();

  await connection
    .createQueryBuilder()
    .insert()
    .into(User)
    .values(users)
    .execute();

  console.log('Seeded 10,000 orders and 1,000 users');
}
