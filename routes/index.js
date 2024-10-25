const fs = require("fs");
const files = fs.readdirSync(__dirname);
const isRoute = ".routes.js";
const routes = {};

files.forEach((file) => {
  if (file.endsWith(isRoute)) {
    const routeName = file.replace(isRoute, "");
    routes[routeName] = require(`./${file}`);
  }
});

module.exports = routes;
