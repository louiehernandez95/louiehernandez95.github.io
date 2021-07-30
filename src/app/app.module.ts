import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DataService } from './services/data.service';
import { ScatterComponent } from './scatter/scatter.component';
import { PieComponent } from './pie/pie.component';
import { MaterialModule } from './material.module';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    ScatterComponent,
    PieComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule,
    MaterialModule,
  ],
  providers: [
    DataService,
    {
      provide: APP_INITIALIZER,
      useFactory: (data: DataService) =>
        () => data.getData(),
      deps: [DataService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
