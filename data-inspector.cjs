// Data Inspector - Shows all stored user data
const http = require('http');

const inspectData = async () => {
  console.log('🔍 Fashion Era Data Inspector');
  console.log('=' .repeat(60));
  
  try {
    // Make request to health endpoint to get user data
    const response = await fetch('http://localhost:5001/health');
    const data = await response.json();
    
    console.log('📊 Server Status:', data.status);
    console.log('🕒 Last Check:', data.timestamp);
    console.log('📧 Email Configured:', data.emailConfigured ? 'Yes' : 'No');
    console.log('');
    
    console.log('👥 STORED USERS:');
    console.log('-' .repeat(40));
    
    if (data.users && data.users.length > 0) {
      data.users.forEach((email, index) => {
        console.log(`${index + 1}. ${email}`);
      });
    } else {
      console.log('No users found in system');
    }
    
    console.log('');
    console.log('🔍 To see detailed user data, check the backend console');
    console.log('   or add a debug endpoint to the server.');
    
  } catch (error) {
    console.log('❌ Could not connect to backend server');
    console.log('   Make sure the backend is running on http://localhost:5001');
    console.log('   Error:', error.message);
  }
  
  console.log('=' .repeat(60));
};

// Add detailed data inspection endpoint to backend
const addDataInspectionEndpoint = () => {
  console.log('💡 SUGGESTION: Add this endpoint to your backend for detailed inspection:');
  console.log('');
  console.log('// Add this to your backend routes:');
  console.log('if (path === \'/api/debug/users\' && method === \'GET\') {');
  console.log('  const userList = Array.from(users.entries()).map(([email, user]) => ({');
  console.log('    email: user.email,');
  console.log('    name: user.name,');
  console.log('    role: user.role,');
  console.log('    id: user.id,');
  console.log('    createdAt: user.createdAt || \'N/A\',');
  console.log('    // password hidden for security');
  console.log('  }));');
  console.log('  ');
  console.log('  sendJSON(res, {');
  console.log('    success: true,');
  console.log('    data: {');
  console.log('      totalUsers: users.size,');
  console.log('      users: userList,');
  console.log('      resetTokens: resetTokens.size');
  console.log('    }');
  console.log('  });');
  console.log('  return;');
  console.log('}');
  console.log('');
};

// Run inspection
inspectData().then(() => {
  addDataInspectionEndpoint();
});
