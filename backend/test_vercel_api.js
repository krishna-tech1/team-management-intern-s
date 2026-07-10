async function test() {
  const cred = { email: 'arjun.v@traxa.com', password: 'Emp@123' };
  try {
    const response = await fetch('https://team-management-intern-s-pzly.vercel.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cred)
    });
    const text = await response.text();
    console.log(`Status:`, response.status);
    console.log(`Response headers:`, response.headers);
    console.log(`Response text:`, text);
  } catch (err) {
    console.error(`Error connecting to Vercel:`, err.message);
  }
}

test();
