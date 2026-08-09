import { App } from './App';

/** Application entry point: creates the app and runs it. */
const app = new App();

app.run().catch((error) => {
    console.error('Error en la aplicación:', error);
    process.exit(1);
});
