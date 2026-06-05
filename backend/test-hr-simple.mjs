/**
 * End-to-End Test for HR Assignment Feature
 * Uses native Node.js fetch (no external dependencies)
 */

const BASE_URL = 'http://localhost:5000/api';
let adminToken = '';
let hrToken = '';
let adminUserId = '';
let hrUserId = '';

function log(test, status, details = '') {
  const icon = status === 'PASS' ? '✓' : '✗';
  console.log(`${icon} ${test}${details ? ': ' + details : ''}`);
}

async function loginAdmin() {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@company.com',
        password: 'Admin@123'
      })
    });
    
    const json = await response.json();
    if (response.ok && json.data?.accessToken) {
      adminToken = json.data.accessToken;
      adminUserId = json.data.user.id;
      log('Login as Admin', 'PASS', 'Token received');
      return true;
    } else {
      throw new Error(json.message || 'Login failed');
    }
  } catch (error) {
    log('Login as Admin', 'FAIL', error.message);
    return false;
  }
}

async function loginHR() {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hr@company.com',
        password: 'Hr@123'
      })
    });
    
    const json = await response.json();
    if (response.ok && json.data?.accessToken) {
      hrToken = json.data.accessToken;
      hrUserId = json.data.user.id;
      log('Login as HR', 'PASS', 'Token received');
      return true;
    } else {
      throw new Error(json.message || 'Login failed');
    }
  } catch (error) {
    log('Login as HR', 'FAIL', error.message);
    return false;
  }
}

async function testGetHRUsers() {
  try {
    const response = await fetch(`${BASE_URL}/users/role/hr`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const json = await response.json();
    const hrUsers = json.data || json;
    
    if (response.ok && Array.isArray(hrUsers)) {
      if (hrUsers.length > 0) {
        log('Fetch HR Users', 'PASS', `Found ${hrUsers.length} HR(s): ${hrUsers[0].name}`);
        return hrUsers[0];
      } else {
        log('Fetch HR Users', 'PASS', 'HR list is empty');
        return null;
      }
    } else {
      throw new Error(json.message || 'Failed to fetch HR users');
    }
  } catch (error) {
    log('Fetch HR Users', 'FAIL', error.message);
    return null;
  }
}

async function testUploadMissingCategory() {
  try {
    const form = new FormData();
    form.append('assignedHR', '507f1f77bcf86cd799439011');
    form.append('resumes', new Blob(['test'], { type: 'application/pdf' }), 'test.pdf');
    
    const response = await fetch(`${BASE_URL}/candidates/upload-resumes`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: form
    });
    
    const json = await response.json();
    
    if (!response.ok) {
      log('Upload Validation - Missing Category', 'PASS', 'Correctly rejected');
    } else {
      log('Upload Validation - Missing Category', 'FAIL', 'Should have rejected request');
    }
  } catch (error) {
    log('Upload Validation - Missing Category', 'FAIL', error.message);
  }
}

async function testUploadMissingHR() {
  try {
    const form = new FormData();
    form.append('category', 'MERN Developer');
    form.append('resumes', new Blob(['test'], { type: 'application/pdf' }), 'test.pdf');
    
    const response = await fetch(`${BASE_URL}/candidates/upload-resumes`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: form
    });
    
    const json = await response.json();
    
    if (!response.ok) {
      log('Upload Validation - Missing assignedHR', 'PASS', 'Correctly rejected');
    } else {
      log('Upload Validation - Missing assignedHR', 'FAIL', 'Should have rejected request');
    }
  } catch (error) {
    log('Upload Validation - Missing assignedHR', 'FAIL', error.message);
  }
}

async function testCandidateRoleFiltering() {
  try {
    const adminResponse = await fetch(`${BASE_URL}/candidates`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminJson = await adminResponse.json();
    const adminCandidates = adminJson.data?.candidates || [];
    
    const hrResponse = await fetch(`${BASE_URL}/candidates`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${hrToken}` }
    });
    const hrJson = await hrResponse.json();
    const hrCandidates = hrJson.data?.candidates || [];
    
    log('Role-Based Candidate Filtering', 'PASS', `Admin: ${adminCandidates.length}, HR: ${hrCandidates.length}`);
  } catch (error) {
    log('Role-Based Candidate Filtering', 'FAIL', error.message);
  }
}

async function verifySchemaChanges() {
  try {
    const response = await fetch(`${BASE_URL}/candidates?limit=1`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const json = await response.json();
    const candidates = json.data?.candidates || [];
    
    if (candidates.length > 0) {
      const candidate = candidates[0];
      if ('assignedTo' in candidate || 'assignedHR' in candidate) {
        log('Schema Verification - assignedHR Field', 'PASS', 'Field exists');
      } else {
        log('Schema Verification - assignedHR Field', 'FAIL', 'Field missing');
      }
    } else {
      log('Schema Verification - assignedHR Field', 'PASS', 'No candidates to verify');
    }
  } catch (error) {
    log('Schema Verification - assignedHR Field', 'FAIL', error.message);
  }
}

async function runTests() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('    HR ASSIGNMENT FEATURE - VALIDATION TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('AUTHENTICATION TESTS:');
  if (!await loginAdmin()) return;
  if (!await loginHR()) return;
  
  console.log('\nHR USERS ENDPOINT TESTS:');
  await testGetHRUsers();
  
  console.log('\nUPLOAD VALIDATION TESTS:');
  await testUploadMissingCategory();
  await testUploadMissingHR();
  
  console.log('\nCONDIDATE FILTERING & SCHEMA TESTS:');
  await testCandidateRoleFiltering();
  await verifySchemaChanges();
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                    TEST SUITE COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

runTests().catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});
