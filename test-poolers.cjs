const { Client } = require('pg');

const regions = [
  'eu-west-3',    // Paris
  'eu-central-1', // Frankfurt
  'eu-west-1',    // Ireland
  'eu-west-2',    // London
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-southeast-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-southeast-2',
  'sa-east-1',
  'ca-central-1',
  'ap-south-1',
];

const projectRef = 'ywlmwmahgcczdtbfzqin';
const password = decodeURIComponent('cf%2FcyLPA%255fwCs5');

async function testRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const connectionString = `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@${host}:5432/postgres?sslmode=require`;
  
  const client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    console.log(`✅ SUCCESS! Region is ${region}`);
    await client.end();
    return connectionString;
  } catch (err) {
    if (err.message.includes('password authentication failed')) {
       console.log(`✅ Region is ${region} but password failed.`);
       return connectionString;
    }
    return null;
  }
}

async function run() {
  console.log('Testing Supabase regions...');
  const promises = regions.map(r => testRegion(r));
  const results = await Promise.all(promises);
  const found = results.find(r => r !== null);
  if (found) {
    console.log('\n--- CORRECT URL ---');
    console.log(found);
  } else {
    console.log('\nCould not find region. Either the DB is paused or the project was deleted.');
  }
  process.exit(0);
}
run();
