import { seedClientSuccessData } from '../lib/client-success/seed-client-success';
import { syncProductionContactSettings } from '../lib/client-success/contact-service';

async function main() {
  console.log('--- Starting Client Success & Platform Settings Seeder ---');
  await seedClientSuccessData();
  await syncProductionContactSettings();
  console.log('--- Client Success Seeding & Sync Complete ---');
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
