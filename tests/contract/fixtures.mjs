// Shared fixtures for the API contract suite. Used only against the *_test database.
export const ADMIN = {
  email: 'gmehta.dev@gmail.com', // on AUTHORIZED_EMAILS
  phone_number: '9000000001',
  password: 'contract-admin-pass'
};

// 1x1 transparent PNG
export const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

export const SUPER_ADMIN = {
  email: 'contract.superadmin@example.com',
  phone_number: '9000000002',
  password: 'contract-super-pass'
};
