import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { AlertController } from '@ionic/angular';
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';
import { BehaviorSubject } from 'rxjs';
import storageKeyNameConstants from '../constants/storage-keyname-constants';
import messageConstants from '../constants/message-constants';

export interface StoredLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

const LOCATION_FETCH_TIMEOUT_MS = 5000;
const LOCATION_FETCH_RETRY_TIMEOUT_MS = 8000;
const FALLBACK_COORDS = { latitude: 22.3072, longitude: 73.1812 };

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly storageKey = storageKeyNameConstants.LAST_KNOWN_COORDINATES;
  private initPromise: Promise<void> | null = null;

  /** Emits the latest location when it changes (cached or fresh). */
  readonly location$ = new BehaviorSubject<StoredLocation | null>(null);

  /** Emits true when permission is granted, false when denied. */
  readonly permissionGranted$ = new BehaviorSubject<boolean>(false);

  constructor(private alertController: AlertController) {
    this.location$.next(this.getCachedLocation());
    this.updatePermissionState();
  }

  /**
   * Call at app startup. Non-blocking: requests permission, uses cached location
   * for instant UX, and refreshes location in the background.
   */
  init(): void {
    if (this.initPromise) return;
    this.initPromise = this.runInit();
  }

  private async runInit(): Promise<void> {
    try {
      const permission = await this.requestPermission();
      if (permission) {
        this.permissionGranted$.next(true);
        const cached = this.getCachedLocation();
        if (cached) {
          this.location$.next(cached);
        }
        await this.fetchAndStoreLocation();
      } else {
        this.permissionGranted$.next(false);
      }
    } catch {
      this.permissionGranted$.next(false);
    }
  }

  /**
   * Returns cached location synchronously for instant map loading.
   */
  getCachedLocation(): StoredLocation | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (
        typeof parsed?.latitude !== 'number' ||
        typeof parsed?.longitude !== 'number'
      ) {
        return null;
      }
      return {
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        timestamp: parsed.timestamp || 0
      };
    } catch {
      return null;
    }
  }

  /**
   * Returns cached location or fallback coords. Use for map initialization.
   */
  getLocationForMap(): { latitude: number; longitude: number } {
    const cached = this.getCachedLocation();
    if (cached) {
      return { latitude: cached.latitude, longitude: cached.longitude };
    }
    return { ...FALLBACK_COORDS };
  }

  /**
   * Fetches current GPS position, stores it, and emits. Handles timeouts,
   * GPS off, and other edge cases.
   */
  async fetchAndStoreLocation(): Promise<StoredLocation | null> {
    const allowed = await this.checkPermission();
    if (!allowed) return null;

    const stored = await this.fetchWithRetry();
    if (stored) {
      this.persist(stored);
      this.location$.next(stored);
    }
    return stored;
  }

  private async fetchWithRetry(): Promise<StoredLocation | null> {
    // Fast attempt: accept any recent cached position (up to 60s old)
    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: LOCATION_FETCH_TIMEOUT_MS,
        maximumAge: 60000
      });
      const stored = this.toStored(pos?.coords);
      if (stored) return stored;
    } catch { /* fall through to retry */ }

    // Retry with high accuracy and shorter cache
    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: LOCATION_FETCH_RETRY_TIMEOUT_MS,
        maximumAge: 30000
      });
      return this.toStored(pos?.coords);
    } catch {
      return null;
    }
  }

  private toStored(coords: { latitude?: number; longitude?: number } | undefined): StoredLocation | null {
    if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
      return null;
    }
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      timestamp: Date.now()
    };
  }

  private persist(loc: StoredLocation): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(loc));
    } catch {
      // ignore storage errors
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      const current = await Geolocation.checkPermissions();
      if (current.location === 'granted' || current.coarseLocation === 'granted') {
        return true;
      }
      const result = await Geolocation.requestPermissions();
      return result.location === 'granted' || result.coarseLocation === 'granted';
    } catch {
      return false;
    }
  }

  async checkPermission(): Promise<boolean> {
    try {
      const p = await Geolocation.checkPermissions();
      const granted = p.location === 'granted' || p.coarseLocation === 'granted';
      this.permissionGranted$.next(granted);
      return granted;
    } catch {
      this.permissionGranted$.next(false);
      return false;
    }
  }

  private async updatePermissionState(): Promise<void> {
    try {
      const p = await Geolocation.checkPermissions();
      this.permissionGranted$.next(p.location === 'granted' || p.coarseLocation === 'granted');
    } catch {
      this.permissionGranted$.next(false);
    }
  }

  /**
   * Shows a user-friendly alert when permission is denied, with option to open settings.
   */
  async showPermissionDeniedAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Location Required',
      message: messageConstants.locationPermissionDeniedMessage,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Open Settings',
          handler: () => {
            NativeSettings.open({
              optionAndroid: AndroidSettings.ApplicationDetails,
              optionIOS: IOSSettings.App
            });
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Alias for backwards compatibility with map's persist call. Stores raw coords.
   */
  persistCoordinates(coords: { latitude?: number; longitude?: number } | undefined): void {
    const stored = this.toStored(coords);
    if (stored) {
      this.persist(stored);
      this.location$.next(stored);
    }
  }
}
