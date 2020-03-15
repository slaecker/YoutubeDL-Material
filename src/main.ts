import '@angular/localize/init';

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { environment } from './environments/environment';

import { loadTranslations } from '@angular/localize';
import { getTranslations, ParsedTranslationBundle } from '@locl/core';

if (environment.production) {
  enableProdMode();
}

const locale = localStorage.getItem('locale');
if (locale) {
    getTranslations(`./assets/i18n/messages.${locale}.json`).then(
      (data: ParsedTranslationBundle) => {
        loadTranslations(data as any);
        import('./app/app.module').then(module => {
          platformBrowserDynamic()
            .bootstrapModule(module.AppModule)
            .catch(err => console.error(err));
        });
    }
    ).catch(err => {
      import('./app/app.module').then(module => {
        platformBrowserDynamic()
          .bootstrapModule(module.AppModule)
          .catch(err2 => console.error(err2));
      });
    });
} else {
  console.log('no locale');
  import('./app/app.module').then(module => {
    platformBrowserDynamic()
      .bootstrapModule(module.AppModule)
      .catch(err => console.error(err));
  });
}
