import { provisionQAUsers } from './provision-qa-users';

export async function seedProductionQA() {
  await provisionQAUsers({ rotatePasswords: true });
}

if (require.main === module) {
  seedProductionQA()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
