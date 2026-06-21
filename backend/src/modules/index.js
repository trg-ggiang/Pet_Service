require("../config/env");

const auth = require("./auth");
const customers = require("./customers");
const serviceCatalog = require("./services");
const staff = require("./staff");
const doctors = require("./doctors");
const medical = require("./medical");
const users = require("./users");

const apiModules = [
  { path: "/api/auth", router: auth.router },
  { path: "/api/customer", router: customers.router },
  { path: "/api/customer/services", router: serviceCatalog.router },
  { path: "/api/staff", router: staff.router },
  { path: "/api/doctor/appointments", router: medical.router },
  { path: "/api/doctor", router: doctors.router },
  { path: "/api/admin", router: users.adminRouter },
];

module.exports = { apiModules };
