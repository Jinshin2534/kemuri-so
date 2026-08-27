import './styles.css';
import { registerRoute, start } from './ui/app.js';
import { renderHome } from './ui/home.js';
import { renderJudge } from './ui/judge.js';
import { renderRecords } from './ui/records.js';

registerRoute('', renderHome);
registerRoute('judge', renderJudge);
registerRoute('records', renderRecords);

start();
