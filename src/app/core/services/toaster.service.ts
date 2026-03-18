import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class ToasterService {
  constructor(public toastController: ToastController) {}

  async presentToast(toastMessage: string, toastType: string) {
    const toast = await this.toastController.create({
      message: toastMessage,
      duration: 2000,
      position: 'top',
      color: toastType,
    });
    toast.present();
  }
  async scanWornToast(toastMessage: string, toastType: string) {
    const toast = await this.toastController.create({
      message: toastMessage,
      duration: 10000,
      position: "middle",
      color: toastType,
      cssClass: "scanToster"
    });
    toast.present();
  }
}
