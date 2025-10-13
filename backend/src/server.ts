import app from './app';
import dotenv from 'dotenv';
dotenv.config();

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`Listening on ${port}`));
