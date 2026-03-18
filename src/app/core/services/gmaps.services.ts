import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: 'root'
})
export class GMapsService {

  constructor() { }

  loadGoogleMaps(): Promise<any> {
    const win = window as any;
    const gModule = win.google;

    if (gModule && gModule.maps) {
      return Promise.resolve(gModule.maps);
    }

    const existingScript = document.querySelector('script[data-gmaps-loader="true"]') as HTMLScriptElement | null;

    if (existingScript) {
      return new Promise((resolve, reject) => {
        const waitStartedAt = Date.now();
        const waitInterval = setInterval(() => {
          const loadedGoogleModule = win.google;
          if (loadedGoogleModule && loadedGoogleModule.maps) {
            clearInterval(waitInterval);
            resolve(loadedGoogleModule.maps);
          } else if (Date.now() - waitStartedAt > 20000) {
            clearInterval(waitInterval);
            reject('Google Map SDK loading timed out');
          }
        }, 250);
      });
    }

    return new Promise((resolve, reject) => {

      const script = document.createElement('script');
      let timeoutHandle: any;

      script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsAPIKey}&v=weekly&libraries=places,marker&loading=async`;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-gmaps-loader', 'true');

      document.body.appendChild(script);

      timeoutHandle = setTimeout(() => {
        reject('Google Map SDK loading timed out');
      }, 20000);

      script.onload = () => {
        clearTimeout(timeoutHandle);
        const loadedGoogleModule = win.google;

        if (loadedGoogleModule && loadedGoogleModule.maps) {
          resolve(loadedGoogleModule.maps);
        } else {
          reject('Google Map SDK is not available');
        }
      };

      script.onerror = () => {
        clearTimeout(timeoutHandle);
        reject('Google Map SDK failed to load');
      };

    });

  }

}