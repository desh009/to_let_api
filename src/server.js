import 'dotenv/config';
import { app } from './app.js';
import { initializeFirebase } from './config/firebase.js';

const port = Number(process.env.PORT) || 3000;

try {
  initializeFirebase();
  app.listen(port, () => {
    console.log(`To-Let API is running on http://localhost:${port}`);
  });
} catch (error) {
  console.error(`Unable to start To-Let API: ${error.message}`);
  process.exit(1);
}
