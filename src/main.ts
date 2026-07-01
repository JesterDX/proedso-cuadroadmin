import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

providers: [
  provideCharts(withDefaultRegisterables())
]
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
