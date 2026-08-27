import './styles.css';
import { registerRoute, start } from './ui/app.js';
import { renderHome } from './ui/home.js';

registerRoute('', renderHome);
start();
