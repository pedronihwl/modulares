import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables before all tests
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });
