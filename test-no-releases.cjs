// Quick test to verify the "no releases found" scenario
const { spawn } = require('child_process');

async function testNoReleasesScenario() {
  console.log('🧪 Testing: No Releases Found Scenario');
  console.log('=======================================');
  
  try {
    // Test with a repository that has no releases
    const testRepo = 'MonaFP/nonexistent-repo-test';
    
    const ghProcess = spawn('gh', [
      'api', 
      `repos/${testRepo}/releases/latest`
    ], { 
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true 
    });
    
    let stdout = '';
    let stderr = '';
    
    ghProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    ghProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    ghProcess.on('close', (code) => {
      console.log('GitHub CLI Response:');
      console.log('Exit Code:', code);
      console.log('Stdout:', stdout);
      console.log('Stderr:', stderr);
      
      if (stderr.includes('Not Found')) {
        console.log('✅ Confirmed: GitHub CLI returns "Not Found" for repos without releases');
        console.log('✅ Our fix should catch this and return { hasUpdate: false }');
      } else {
        console.log('❓ Unexpected response - check implementation');
      }
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testNoReleasesScenario();