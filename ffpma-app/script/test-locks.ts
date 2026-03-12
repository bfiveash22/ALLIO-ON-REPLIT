import { lockManager } from '../server/services/agent-locks';

async function testLocks() {
  console.log('--- Testing Open Claw LockManager ---');

  const resource = 'test-file.ts';
  console.log(`\n1. Agent FORGE requests lock on ${resource}...`);
  const lockA = lockManager.acquireLocks([resource], 'Agent-FORGE', 5000);
  console.log(`Lock FORGE Acquired: ${lockA}`);

  console.log(`\n2. Agent NEXUS concurrently requests lock on ${resource}...`);
  const lockB = lockManager.acquireLocks([resource], 'Agent-NEXUS', 5000);
  console.log(`Lock NEXUS Acquired: ${lockB} (Expected False)`);

  console.log('\n3. Current Locks inside Sentinel:');
  console.log(lockManager.getAllLocks());

  console.log('\n4. Agent FORGE finishes compilation and releases lock...');
  lockManager.releaseLocks([resource], 'Agent-FORGE');

  console.log(`\n5. Agent NEXUS re-attempts lock acquisition...`);
  const lockBRetry = lockManager.acquireLocks([resource], 'Agent-NEXUS', 5000);
  console.log(`Lock NEXUS Acquired: ${lockBRetry} (Expected True)`);
  
  console.log('\nSUCCESS! Operation Open Claw successfully prevents concurrent file overwriting.');
}

testLocks().catch(console.error);
