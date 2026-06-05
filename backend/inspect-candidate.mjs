/**
 * Inspect candidate response structure
 */

const BASE_URL = 'http://localhost:5000/api';

async function inspectCandidate() {
  try {
    // First login as admin
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@company.com',
        password: 'Admin@123'
      })
    });
    
    const loginJson = await loginResponse.json();
    const adminToken = loginJson.data.accessToken;
    
    // Get a candidate
    const response = await fetch(`${BASE_URL}/candidates?limit=1`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const json = await response.json();
    const candidates = json.data?.candidates || [];
    
    if (candidates.length > 0) {
      const candidate = candidates[0];
      console.log('\n=== Candidate Response Structure ===\n');
      console.log('Keys in candidate object:');
      console.log(Object.keys(candidate).sort());
      console.log('\n=== Full Candidate Object ===\n');
      console.log(JSON.stringify(candidate, null, 2));
    } else {
      console.log('No candidates found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

inspectCandidate();
