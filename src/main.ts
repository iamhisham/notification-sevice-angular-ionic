import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

//Code Mirror imports
import 'node_modules/codemirror/addon/edit/closebrackets';
import 'node_modules/codemirror/addon/edit/closetag';
import 'node_modules/codemirror/addon/edit/matchbrackets';
import 'node_modules/codemirror/addon/edit/matchtags';
import 'node_modules/codemirror/addon/fold/foldcode';
import 'node_modules/codemirror/addon/fold/brace-fold';
import 'node_modules/codemirror/addon/fold/xml-fold';
import 'node_modules/codemirror/addon/fold/comment-fold';
import 'node_modules/codemirror/mode/htmlmixed/htmlmixed';
import 'node_modules/codemirror/addon/display/autorefresh';
import 'node_modules/codemirror/addon/search/search.js';
import 'node_modules/codemirror/addon/search/searchcursor.js';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
