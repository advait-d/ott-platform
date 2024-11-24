import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@NgModule({
  imports: [IonicModule],
  exports: [IonicModule], // export IonicModule to use in standalone components
})
export class IonicSharedModule {}
