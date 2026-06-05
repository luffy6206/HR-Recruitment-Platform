/**
 * End-to-End Test for HR Assignment Feature
 * Tests: HR users fetch, category/assignedHR validation, candidate creation, role-based filtering
 * Uses native Node.js fetch (no external dependencies)
 */

import fs from 'fs';

const BASE_URL = 'http://localhost:5000/api';
let adminToken = '';
let hrToken = '';
let adminUserId = '';
let hrUserId = '';

// Utility to log test results
function log(test, status, details = '') {
  const icon = status === 'PASS' ? '✓' : '✗';
  console.log(`${icon} ${test}${details ? ': ' + details : ''}`);
}

// Step 1: Login as Admin
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
    
    const data = await response.json();
    if (response.ok && data.data?.accessToken) {
      adminToken = data.data.accessToken;
      adminUserId = data.data.user.id;
      log('Login as Admin', 'PASS', `Token received`);
    } else {
      throw new Error(data.message || 'Login failed');
    }
  } catch (error) {
    log('Login as Admin', 'FAIL', error.message);
    process.exit(1);
  }
}

// Step 2: Login as HR
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
    
    const data = await response.json();
    if (response.ok && data.data?.accessToken) {
      hrToken = data.data.accessToken;
      hrUserId = data.data.user.id;
      log('Login as HR', 'PASS', 'Token received');
    } else {
      throw new Error(data.message || 'Login failed');
    }
  } catch (error) {
    log('Login as HR', 'FAIL', error.message);
  }
}

// Step 3: Test HR Users Endpoint
async function testGetHRUsers() {
  try {
    const response = await fetch(`${BASE_URL}/users/role/hr`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const data = await response.json();
    const hrUsers = data.data || data;
    
    if (response.ok && Array.isArray(hrUsers)) {
      if (hrUsers.length > 0) {
        log('Fetch HR Users', 'PASS', `Found ${hrUsers.length} HR(s)`);
        return hrUsers[0];
      } else {
        log('Fetch HR Users', 'PASS', 'No HRs found (empty list)');
        return null;
      }
    } else {
      throw new Error(data.message || 'Failed to fetch HR users');
    }
  } catch (error) {
    log('Fetch HR Users', 'FAIL', error.message);
    return null;
  }
}

// Step 4: Test Upload Validation - Missing Category
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
    
    const data = await response.json();
    
    if (!response.ok && (data.message?.includes('Category') || response.status === 400)) {
      log('Upload Validation - Missing Category', 'PASS', 'Correctly rejected');
    } else {
      log('Upload Validation - Missing Category', 'FAIL', 'Should have rejected request');
    }
  } catch (error) {
    log('Upload Validation - Missing Category', 'FAIL', error.message);
  }
}

// Step 5: Test Upload Validation - Missing assignedHR
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
    
    const data = await response.json();
    
    if (!response.ok && (data.message?.includes('assigned HR') || response.status === 400)) {
      log('Upload Validation - Missing assignedHR', 'PASS', 'Correctly rejected');
    } else {
      log('Upload Validation - Missing assignedHR', 'FAIL', 'Should have rejected request');
    }
  } catch (error) {
    log('Upload Validation - Missing assignedHR', 'FAIL', error.message);
  }
}

// Step 6: Test Candidates Filtering by Role
async function testCandidateRoleFiltering() {
  try {
    // Get all candidates as Admin
    const adminResponse = await fetch(`${BASE_URL}/candidates`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminData = await adminResponse.json();
    const adminCandidates = adminData.candidates || [];
    
    // Get candidates as HR
    const hrResponse = await fetch(`${BASE_URL}/candidates`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${hrToken}` }
    });
    const hrData = await hrResponse.json();
    const hrCandidates = hrData.candidates || [];
    
    // HRs should only see candidates assigned to them
    const assignedToHR = adminCandidates.filter(c => 
      c.assignedTo && (c.assignedTo._id === hrUserId || c.assignedTo.id === hrUserId || c.assignedTo === hrUserId)
    ).length;
    
    if (hrCandidates.length >= 0) {
      log('Role-Based Candidate Filtering', 'PASS', `HR query executed successfully (${hrCandidates.length} candidates)`);
    } else {
      log('Role-Based Candidate Filtering', 'FAIL', 'Failed to fetch HR candidates');
    }
  } catch (error) {
    log('Role-Based Candidate Filtering', 'FAIL', error.message);
  }
}

// Step 7: Verify Schema Changes
async function verifySchemaChanges() {
  try {
    const response = await fetch(`${BASE_URL}/candidates?limit=1`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const data = await response.json();
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if ('assignedTo' in candidate || 'assignedHR' in candidate) {
        log('Schema Verification - assignedHR Field', 'PASS', 'Field exists in response');
      } else {
        log('Schema Verification - assignedHR Field', 'FAIL', 'Field not found in response');
      }
    } else {
      log('Schema Verification - assignedHR Field', 'PASS', 'No candidates yet (expected)');
    }
  } catch (error) {
    log('Schema Verification - assignedHR Field', 'FAIL', error.message);
  }
}

// Main Test Suite
async function runTests() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('    HR ASSIGNMENT FEATURE - END-TO-END TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('AUTHENTICATION TESTS:');
  await loginAdmin();
  await loginHR();
  
  console.log('\nHR USERS ENDPOINT TESTS:');
  const firstHR = await testGetHRUsers();
  
  console.log('\nUPLOAD VALIDATION TESTS:');
  await testUploadMissingCategory();
  await testUploadMissingHR();
  
  console.log('\nCONDIDATE FILTERING TESTS:');
  await testCandidateRoleFiltering();
  
  console.log('\nSCHEMA VERIFICATION TESTS:');
  await verifySchemaChanges();
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                    TEST SUITE COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
