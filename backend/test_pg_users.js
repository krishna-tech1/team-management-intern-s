const { Client } = require('pg');

const usernames = ['Admin', 'admin', 'Rakshitha', 'rakshitha', 'rakshitha1706', 'Rakshitha1706', 'compliance'];
let found = false;

async function testUsernames() {
  for (const u of usernames) {
    if (found) break;
    const client = new Client({
      user: u,
      host: 'localhost',
      database: 'postgres',
      password: 'Rakshitha1706',
      port: 5432,
    });
    try {
      await client.connect();
      console.log(`Success with username: "${u}"`);
      found = true;
      await client.end();
    } catch (err) {
      console.log(`Failed with username: "${u}" - ${err.message}`);
    }
  }
}

testUsernames().then(() => {
  if (!found) console.log("No username worked.");
});
