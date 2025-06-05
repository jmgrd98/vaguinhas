import { exec } from 'child_process';
import fs from 'fs';

// Clean dist directory
if (fs.existsSync('./dist-workers')) {
  fs.rmSync('./dist-workers', { recursive: true, force: true });
}
fs.mkdirSync('./dist-workers');

// Build worker files
exec('npx tsc -p tsconfig.worker.json', (err, stdout, stderr) => {
  if (err) {
    console.error('❌ Build failed:');
    console.error(stderr);
    process.exit(1);
  }
  
  console.log('✅ Worker build successful');
  console.log('📦 Output files:');
  exec('find dist-workers -type f', (err, files) => {
    console.log(files);
  });
});