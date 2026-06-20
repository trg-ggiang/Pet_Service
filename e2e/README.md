# Pet Service E2E

Playwright smoke tests can run locally with `npm run test:e2e`.

The four business E2E flows require a dedicated seeded test environment. Never point these variables at production:

```text
E2E_FRONTEND_URL=http://localhost:5173
E2E_BACKEND_URL=http://localhost:5050
E2E_CUSTOMER_EMAIL=
E2E_CUSTOMER_PASSWORD=
E2E_STAFF_EMAIL=
E2E_STAFF_PASSWORD=
E2E_DOCTOR_EMAIL=
E2E_DOCTOR_PASSWORD=
```

`TC-E2E-01` through `TC-E2E-04` remain disabled until the repository has a disposable seeded database and dedicated test accounts.
