const { db } = require('@vercel/postgres');
const {
  invoices,
  customers,
  revenue,
  users,
} = require('../app/lib/placeholder-data.js');
const bcrypt = require('bcrypt');

async function seedUsers(client) {
  try {
    /**
     * uuid-ossp는 PostgreSQL의 확장 모듈이다.
     * 이 모듈은 UUID를 생성하기 위한 함수를 제공한다.
     * 이 확장 모듈을 사용하기 위해서는 CREATE EXTENSION 명령어를 사용하여 확장 모듈을 설치해야 한다.
     * CREATE EXTENSION IF NOT EXISTS "uuid-ossp" 명령어는 uuid-ossp 확장 모듈이 설치되어 있지 않은 경우에만 설치한다.
     * uuid-ossp 확장 모듈은 PostgreSQL 9.1 버전부터 기본으로 설치되어 있다.
     * uuid-ossp 확장 모듈을 사용하면 uuid_generate_v4() 함수를 사용하여 UUID를 생성할 수 있다.
     * uuid_generate_v4() 함수는 무작위로 생성된 UUID를 반환한다.
     * uuid_generate_v4() 함수는 UUID 버전 4를 생성한다.
     * UUID 버전 4는 무작위로 생성된 UUID이다.
     * UUID 버전 4는 32개의 16진수 문자로 구성된다.
     * UUID 버전 4는 8-4-4-4-12 형식으로 구성된다.
     * 8개의 문자는 시간 정보를 나타내며, 4개의 문자는 버전 정보를 나타내며, 4개의 문자는 시퀀스 번호를 나타내며, 12개의 문자는 무작위로 생성된 값이다.
     * UUID 버전 4는 122비트의 무작위로 생성된 값이다.
     * UUID 버전 4는 충돌이 발생할 확률이 매우 낮다.
     * UUID 버전 4는 무작위로 생성된 값이기 때문에 순서대로 생성되지 않는다.
     * UUID 버전 4는 무작위로 생성된 값이기 때문에 중복되지 않는다.
     * UUID 버전 4는 무작위로 생성된 값이기 때문에 예측할 수 없다.
     * UUID 버전 4는 무작위로 생성된 값이기 때문에 보안이 좋다.
     */
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    // Create the "users" table if it doesn't exist
    /**
     * users 테이블이 없을 때,
     * id는 UUID로 생성되며 기본값은 uuid_generate_v4()이다. PRIMARY KEY로 설정되어 있다.
     * name은 VARCHAR(255)로 설정되어 있으며, NULL이 아니다.
     * email은 TEXT로 설정되어 있으며, NULL이 아니다. UNIQUE로 설정되어 있다.
     * password는 TEXT로 설정되어 있으며, NULL이 아니다.
     */
    const createTable = await client.sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `;

    console.log(`Created "users" table`);

    // Insert data into the "users" table
    /**
     * users 배열을 순회하면서 user를 하나씩 처리한다.
     * user의 password를 bcrypt.hash() 함수를 사용하여 해싱한다.
     * bcrypt.hash() 함수는 비동기 함수이므로 await 키워드를 사용하여 비동기 처리를 한다.
     */
    const insertedUsers = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return client.sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
      }),
    );

    console.log(`Seeded ${insertedUsers.length} users`);

    return {
      createTable,
      users: insertedUsers,
    };
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
}

async function seedInvoices(client) {
  try {
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    // Create the "invoices" table if it doesn't exist
    /**
     * invoices 테이블이 없을 때,
     * id는 UUID로 생성되며 기본값은 uuid_generate_v4()이다. PRIMARY KEY로 설정되어 있다.
     * customer_id는 UUID로 설정되어 있으며, NULL이 아니다.
     * amount는 INT로 설정되어 있으며, NULL이 아니다.
     * status는 VARCHAR(255)로 설정되어 있으며, NULL이 아니다.
     * date는 DATE로 설정되어 있으며, NULL이 아니다.
     */
    const createTable = await client.sql`
    CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL,
    amount INT NOT NULL,
    status VARCHAR(255) NOT NULL,
    date DATE NOT NULL
  );
`;

    console.log(`Created "invoices" table`);

    // Insert data into the "invoices" table
    const insertedInvoices = await Promise.all(
      invoices.map(
        /**
         * invoices 배열을 순회하면서 invoice를 하나씩 처리한다.
         * invoice의 customer_id, amount, status, date 값을 invoices 테이블에 삽입한다.
         * ON CONFLICT (id) DO NOTHING; 문은 id가 중복되는 경우에는 삽입하지 않는다.
         * id는 UUID로 생성되기 때문에 중복되는 경우는 없다.
         * 따라서, ON CONFLICT (id) DO NOTHING; 문은 항상 삽입한다.
         */
        (invoice) => client.sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
        ON CONFLICT (id) DO NOTHING;
      `,
      ),
    );

    console.log(`Seeded ${insertedInvoices.length} invoices`);

    return {
      createTable,
      invoices: insertedInvoices,
    };
  } catch (error) {
    console.error('Error seeding invoices:', error);
    throw error;
  }
}

async function seedCustomers(client) {
  try {
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    // Create the "customers" table if it doesn't exist
    /**
     * customers 테이블이 없을 때,
     * id는 UUID로 생성되며 기본값은 uuid_generate_v4()이다. PRIMARY KEY로 설정되어 있다.
     * name은 VARCHAR(255)로 설정되어 있으며, NULL이 아니다.
     * email은 VARCHAR(255)로 설정되어 있으며, NULL이 아니다.
     * image_url은 VARCHAR(255)로 설정되어 있으며, NULL이 아니다.
     */
    const createTable = await client.sql`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        image_url VARCHAR(255) NOT NULL
      );
    `;

    console.log(`Created "customers" table`);

    // Insert data into the "customers" table
    const insertedCustomers = await Promise.all(
      /**
       * customers 배열을 순회하면서 customer를 하나씩 처리한다.
       * customer의 id, name, email, image_url 값을 customers 테이블에 삽입한다.
       * ON CONFLICT (id) DO NOTHING; 문은 id가 중복되는 경우에는 삽입하지 않는다.
       * id는 UUID로 생성되기 때문에 중복되는 경우는 없다.
       * 따라서, ON CONFLICT (id) DO NOTHING; 문은 항상 삽입한다.
       */
      customers.map(
        (customer) => client.sql`
        INSERT INTO customers (id, name, email, image_url)
        VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
        ON CONFLICT (id) DO NOTHING;
      `,
      ),
    );

    console.log(`Seeded ${insertedCustomers.length} customers`);

    return {
      createTable,
      customers: insertedCustomers,
    };
  } catch (error) {
    console.error('Error seeding customers:', error);
    throw error;
  }
}

async function seedRevenue(client) {
  try {
    // Create the "revenue" table if it doesn't exist
    /**
     * revenue 테이블이 없을 때,
     * month는 VARCHAR(4)로 설정되어 있으며, NULL이 아니다. UNIQUE로 설정되어 있다.
     * revenue는 INT로 설정되어 있으며, NULL이 아니다.
     */
    const createTable = await client.sql`
      CREATE TABLE IF NOT EXISTS revenue (
        month VARCHAR(4) NOT NULL UNIQUE,
        revenue INT NOT NULL
      );
    `;

    console.log(`Created "revenue" table`);

    // Insert data into the "revenue" table
    const insertedRevenue = await Promise.all(
      /**
       * revenue 배열을 순회하면서 rev를 하나씩 처리한다.
       * rev의 month, revenue 값을 revenue 테이블에 삽입한다.
       * ON CONFLICT (month) DO NOTHING; 문은 month가 중복되는 경우에는 삽입하지 않는다.
       * month는 UNIQUE로 설정되어 있기 때문에 중복되는 경우는 없다.
       * 따라서, ON CONFLICT (month) DO NOTHING; 문은 항상 삽입한다.
       */
      revenue.map(
        (rev) => client.sql`
        INSERT INTO revenue (month, revenue)
        VALUES (${rev.month}, ${rev.revenue})
        ON CONFLICT (month) DO NOTHING;
      `,
      ),
    );

    console.log(`Seeded ${insertedRevenue.length} revenue`);

    return {
      createTable,
      revenue: insertedRevenue,
    };
  } catch (error) {
    console.error('Error seeding revenue:', error);
    throw error;
  }
}

async function main() {
  /**
   * db.connect() 함수를 사용하여 데이터베이스에 연결한다.
   * db.connect() 함수는 Promise 객체를 반환한다.
   * await 키워드를 사용하여 Promise 객체가 처리될 때까지 기다린다.
   * 데이터베이스에 연결된 client 객체를 반환한다.
   * client 객체는 데이터베이스에 연결된 클라이언트 객체이다.
   */
  const client = await db.connect();

  await seedUsers(client);
  await seedCustomers(client);
  await seedInvoices(client);
  await seedRevenue(client);

  /**
   * client.end() 함수를 사용하여 데이터베이스 연결을 종료한다.
   * client.end() 함수는 Promise 객체를 반환한다.
   * await 키워드를 사용하여 Promise 객체가 처리될 때까지 기다린다.
   * 데이터베이스 연결을 종료한다.
   */
  await client.end();
}

main().catch((err) => {
  console.error(
    'An error occurred while attempting to seed the database:',
    err,
  );
});
