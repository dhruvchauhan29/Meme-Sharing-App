const jsonServer = require('json-server');
const auth = require('json-server-auth');
const cors = require('cors');

const app = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// Enable CORS
app.use(cors());

// Parse JSON body
app.use(jsonServer.bodyParser);

// Bind json-server-auth to json-server
app.db = router.db;

// Set default middlewares (logger, static, cors and no-cache)
app.use(middlewares);

// Add json-server-auth middleware
// This must be added before the router
app.use(auth);

// Use default router
app.use(router);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`JSON Server is running on http://localhost:${PORT}`);
});
