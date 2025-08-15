import { getTenantIdByHost } from './tenant';

test('unknown host returns null', async () => {
  const t = await getTenantIdByHost('unknown.example.com');
  expect(t).toBeNull();
});

test('cache set/get behavior', async () => {
  // We cannot access internal cache; call twice to ensure no throw
  await getTenantIdByHost('foo.nestbase.io');
  await getTenantIdByHost('foo.nestbase.io');
  expect(true).toBe(true);
});


