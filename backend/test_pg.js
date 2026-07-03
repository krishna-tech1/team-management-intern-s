const { Client } = require('pg');

const passwords = ['postgres', 'admin', 'root', '1234', '123456', 'Rakshitha1706', 'rakshitha1706', 'password', ''];
let found = false;

async function testPasswords() {
  for (const p of passwords) {
    if (found) break;
    const client = new Client({
      user: 'postgres',
      host: 'localhost',
      database: 'postgres',
      password: p,
      port: 5432,
    });
    try {
      await client.connect();
      console.log(`Success with password: "${p}"`);
      found = true;
      await client.end();
    } catch (err) {
      console.log(`Failed with password: "${p}"`);
    }
  }
}

testPasswords().then(() => {
  if (!found) console.log("No password worked.");
});
