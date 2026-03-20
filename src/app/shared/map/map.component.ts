import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { AlertController, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { finalize, retry, timeout } from 'rxjs/operators';
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';

import intervalPeriodConstants from 'src/app/core/constants/interval-period-constants';
import messageConstants from 'src/app/core/constants/message-constants';
import { GMapsService } from 'src/app/core/services/gmaps.services';
import { LocationService } from 'src/app/core/services/location.service';
import { StateManagementService } from 'src/app/core/services/stateManagement.service';
import { zoneService } from 'src/app/core/services/zone.services';
import { environment } from 'src/environments/environment';
import storageKeyNameConstants from 'src/app/core/constants/storage-keyname-constants';

const currentLocationMarker = {
  icon: 'assets/images/current-location-pin.svg',
  sizeX: 44,
  sizeY: 44
};

const activeRideMarker = {
  icon: 'assets/images/ride-marker.png',
  sizeX: 60,
  sizeY: 60
};

const evegahZoneMarker = {
  icon: 'assets/images/evegah-zone-1.png',
  sizeX: 44,
  sizeY: 44
};

const mapStylesOptions = [
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
];

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, OnDestroy, OnChanges {

  private readonly fallbackMapCenter = {
    latitude: 22.3072,
    longitude: 73.1812
  };
  private readonly lastMapStateStorageKey = storageKeyNameConstants.LAST_MAP_STATE;

  @ViewChild('mapReference', { static: true }) mapElementRef!: ElementRef;
  @ViewChild('searchboxReference', { static: true }) searchBoxElementRef!: ElementRef;

  @Input() showSearchControls!: boolean;
  @Input() rideActive!: boolean;
  @Input() deviceCoordinates!: any;
  @Input() callingFromHome!: boolean;

  googleMaps: any;
  currentLocation: any;
  map: any;
  geocoder: any;
  currentAddress = {
    country: '',
    state: '',
    city: ''
  };
  subscription: Subscription[] = [];
  zones: Array<any> = [];
  activeZoneInfoPopup: any;
  directionsService: any;
  directionsDisplay: any;
  currentLocationMarker: any;
  showSearchbox: boolean = false;
  currentLocationInterval: any;
  _rideActive: boolean = this.rideActive;
  _deviceCoordinates: any;
  showLocationPermissionSection: boolean = false;
  loading = true;
  mapLoadWarning = '';
  lastMapPreviewUrl = '';
  locationPermissionGranted = false;
  zoneMarkers: any[] = [];
  private readonly zoneCacheDurationMs = 2 * 60 * 1000;
  private readonly zoneCache = new Map<string, { at: number; data: any[] }>();
  private zoneFetchInFlight = false;
  private queuedZoneFetchOptions: { showLoader?: boolean } | null = null;
  private readonly geocodeCacheDurationMs = 10 * 60 * 1000;
  private readonly geocodeCache = new Map<string, { country: string; state: string; city: string; at: number }>();
  private readonly fallbackAddress = { country: 'India', state: 'Gujarat', city: 'Vadodara' };

  constructor(
    private gmapsService: GMapsService,
    private zoneService: zoneService,
    public alertController: AlertController,
    public loadingController: LoadingController,
    private stateManagementService: StateManagementService,
    private locationService: LocationService
  ) { }

  ngOnInit() {
    this.showSearchbox = this.showSearchControls;
    const cachedMapState = this.getCachedMapState();
    this.setMapPreview(cachedMapState?.lat, cachedMapState?.lng, cachedMapState?.zoom);
  }

  ngOnChanges(changes: SimpleChanges): void {

    const changedShowSearchControls = changes['showSearchControls'];
    const changedRideActive = changes['rideActive'];
    const changedDeviceCoordinates = changes['deviceCoordinates'];

    this.showSearchbox = changedShowSearchControls ? changedShowSearchControls.currentValue : this.showSearchbox;

    // either their is some changes in rideActive or change in deviceCoordinates, run handleRidePropsChange fn
    if (
      changedRideActive ||
      // previous value and current values both are type of object, 
      // so for detecting any change we had converted them into string
      JSON.stringify(changedDeviceCoordinates?.previousValue) !== JSON.stringify(changedDeviceCoordinates?.currentValue)
    ) {
      this.handleRidePropsChange(changedRideActive, changedDeviceCoordinates);
    }

  }

  ngAfterViewInit() {
    this.initializeMap();
  }

  async initializeMap() {
    try {

      const googleMaps = await this.gmapsService.loadGoogleMaps();
      this.googleMaps = googleMaps;

      const mapElement = this.mapElementRef.nativeElement;

      let coordinates: any;

      if (this._rideActive === true) {
        coordinates = this.deviceCoordinates;
      } else {
        coordinates = this.locationService.getLocationForMap();
      }

      const initialLocation = new googleMaps.LatLng(coordinates.latitude, coordinates.longitude);
      this.geocoder = new googleMaps.Geocoder();

      this.map = new googleMaps.Map(mapElement, {
        center: initialLocation,
        zoom: 12,
        disableDefaultUI: true,
        zoomControl: true,
      });

      this.map.addListener('idle', () => {
        const center = this.map?.getCenter?.();
        if (!center) {
          return;
        }
        const lat = center.lat();
        const lng = center.lng();
        const zoom = this.map?.getZoom?.() || 12;
        this.setMapPreview(lat, lng, zoom);
      });

      this.map.setOptions({ styles: mapStylesOptions });

      this.initializeSearchboxAutocompleteControl();

      this.bindDirectionService(googleMaps);

      this.addCurrentLocationMarker(initialLocation);

      // Immediately fetch zones for fallback/cached area while GPS resolves
      this.currentAddress = { ...this.fallbackAddress };
      this.getNearbyZones({ showLoader: false });

      this.loading = false;
      this.mapLoadWarning = '';

      if (this._rideActive === false) {
        this.locationService.checkPermission().then((hasPermission) => {
          this.locationPermissionGranted = hasPermission;
          this.showLocationPermissionSection = !hasPermission;
        });

        this.handleCurrentLocationInterval(googleMaps);

        // Fetch fresh GPS location and update map + zones in one step
        this.locationService.fetchAndStoreLocation().then((stored) => {
          if (!stored || !this.map || !this.currentLocationMarker || !this.googleMaps) {
            return;
          }
          this.currentLocation = { coords: stored };
          const updatedLocation = new this.googleMaps.LatLng(stored.latitude, stored.longitude);
          this.currentLocationMarker.setPosition(updatedLocation);
          this.map.setCenter(updatedLocation);
          this.getCurrentAddress(updatedLocation, true, { showLoader: false });
        }).catch(() => {
          // GPS failed, geocode from initial (cached/fallback) location for correct zones
          this.getCurrentAddress(initialLocation, true, { showLoader: false });
        });
      } else {
        this.getCurrentAddress(initialLocation, true, { showLoader: false });
      }

    } catch (error) {
      console.log(error);
      this.loading = false;
      this.mapLoadWarning = '';
    }

  }

  checkDeviceCoordinatesAvailability(deviceCoordinates: any) {

    if (!deviceCoordinates) {
      return false;
    }

    if (!deviceCoordinates.latitude || !deviceCoordinates.longitude) {
      return false;
    }

    return true;

  }

  handleCurrentLocationInterval(googleMaps: any) {

    this.currentLocationInterval = setInterval(async () => {

      this.currentLocation = await this.getCurrentLocation();
      const coordinates = this.currentLocation?.coords;

      if (!coordinates) {
        return;
      }

      const _location = new googleMaps.LatLng(coordinates.latitude, coordinates.longitude);
      this.currentLocationMarker.setPosition(_location);

    }, intervalPeriodConstants.currentLocationUpdateInterval);

  }

  async handleRidePropsChange(changedRideActive: any, changedDeviceCoordinates: any) {

    this._rideActive = changedRideActive ? changedRideActive.currentValue : this._rideActive;
    this._deviceCoordinates = changedDeviceCoordinates ? changedDeviceCoordinates.currentValue : this._deviceCoordinates;

    if (!this.googleMaps) {
      return;
    }

    let icon, lat, lng;

    if (this._rideActive === true) {

      // if ride got started, clear the currentLocationInterval
      clearInterval(this.currentLocationInterval);

      if (this.checkDeviceCoordinatesAvailability(this._deviceCoordinates) === false) {
        return;
      }

      lat = +this._deviceCoordinates.latitude;
      lng = +this._deviceCoordinates.longitude;

      icon = {
        url: activeRideMarker.icon,
        scaledSize: new this.googleMaps.Size(activeRideMarker.sizeX, activeRideMarker.sizeY),
      };

    } else {

      this.currentLocation = await this.getCurrentLocation();
      const coordinates = this.currentLocation?.coords || this.fallbackMapCenter;

      lat = +coordinates.latitude;
      lng = +coordinates.longitude;

      icon = {
        url: currentLocationMarker.icon,
        scaledSize: new this.googleMaps.Size(currentLocationMarker.sizeX, currentLocationMarker.sizeY),
      };

    }

    const location = new this.googleMaps.LatLng(lat, lng);

    this.currentLocationMarker?.setPosition(location);
    this.currentLocationMarker?.setIcon(icon);

    this.map.setCenter({ lat, lng });
    this.map.setZoom(12);

  }

  async requestLocationPermission() {
    const granted = await this.locationService.requestPermission();
    if (granted) {
      this.showAlert('Location Permission is enabled. Click on Refresh Location Status button.');
    } else {
      await this.locationService.showPermissionDeniedAlert();
    }
  }

  async refreshLocationStatus() {
    const granted = await this.locationService.checkPermission();
    if (granted) {
      this.showLocationPermissionSection = false;
      this.locationPermissionGranted = true;
      this.loading = true;
      this.initializeMap();
    } else {
      this.showLocationPermissionSection = true;
      this.locationPermissionGranted = false;
    }
  }

  async getCurrentLocation(): Promise<{ coords: { latitude: number; longitude: number } } | null> {
    const allowed = await this.locationService.checkPermission();
    if (!allowed) return null;

    const stored = await this.locationService.fetchAndStoreLocation();
    if (!stored) return null;
    return { coords: { latitude: stored.latitude, longitude: stored.longitude } };
  }

  async _checkLocationPermission() {
    return new Promise<boolean>(async (resolve) => {
      try {

        const permission = await Geolocation.checkPermissions();

        if (permission.location === 'granted' || permission.coarseLocation === 'granted') {

          this.locationPermissionGranted = true;

          resolve(true);

        } else {

          const _permission = await Geolocation.requestPermissions();

          if (_permission.location === 'granted' || _permission.coarseLocation === 'granted') {
            this.locationPermissionGranted = true;
            resolve(true);
          } else {
            this.locationPermissionGranted = false;
            resolve(false);
          }

        }

      } catch (error) {
        resolve(false);
      }
    });
  }

  bindDirectionService(googleMaps: any) {

    this.directionsService = new googleMaps.DirectionsService;
    this.directionsDisplay = new googleMaps.DirectionsRenderer;
    this.directionsDisplay = new googleMaps.DirectionsRenderer({ preserveViewport: true });

    this.directionsDisplay.setMap(this.map);
    this.directionsDisplay.setOptions({
      polylineOptions: {
        strokeWeight: 6,
        strokeOpacity: 0.8,
        strokeColor: 'blue'
      },
      suppressMarkers: true
    });

  }

  async initializeSearchboxAutocompleteControl() {

    let autocomplete = new this.googleMaps.places.Autocomplete(this.searchBoxElementRef.nativeElement);

    autocomplete.bindTo("bounds", this.map);

    autocomplete.addListener("place_changed", () => {

      const place = autocomplete.getPlace();

      if (!place.geometry || !place.geometry.location) {
        return;
      }

      if (place.geometry.viewport) {
        this.map.fitBounds(place.geometry.viewport);
      } else {
        this.map.setCenter(place.geometry.location);
        this.map.setZoom(12);
      }

      const currentAddress = this.getCountryStateCityForSearchedLocation(place);

      this.currentAddress = currentAddress;

      this.getNearbyZones();

    });

  }

  searchLocationByText(searchText: string) {
    const query = `${searchText || ''}`.trim();

    if (!query || !this.geocoder || !this.map) {
      return;
    }

    this.geocoder.geocode({ address: query }, (results: any, status: any) => {
      if (status === 'OK' && results?.length) {
        const place = results[0];

        if (place.geometry?.viewport) {
          this.map.fitBounds(place.geometry.viewport);
        } else if (place.geometry?.location) {
          this.map.setCenter(place.geometry.location);
          this.map.setZoom(12);
        }

        const currentAddress = this.getCountryStateCityForSearchedLocation(place);
        this.currentAddress = currentAddress;
        this.getNearbyZones();
      } else {
        this.showAlert('No location found for this search.');
      }
    });
  }

  async getNearbyZones(options: { showLoader?: boolean } = {}) {

    const showLoader = options.showLoader !== false;

    const { country, state, city } = this.currentAddress;

    if (!country && !state && !city) {
      return;
    }

    const cacheKey = `${country || ''}|${state || ''}|${city || ''}`.toLowerCase();
    const cachedEntry = this.zoneCache.get(cacheKey);
    const now = Date.now();

    if (cachedEntry && now - cachedEntry.at <= this.zoneCacheDurationMs) {
      this.zones = cachedEntry.data;
      this.addEvegahZonesMarkers();
      return;
    }

    if (this.zoneFetchInFlight) {
      this.queuedZoneFetchOptions = {
        showLoader: showLoader || this.queuedZoneFetchOptions?.showLoader
      };
      return;
    }

    this.zoneFetchInFlight = true;

    if (showLoader) {
      this.showLoading(messageConstants.fetchingEvegahZones);
    }

    this.subscription.push(
      this.zoneService.getNearbyZones(country, state, city)
        .pipe(
          timeout(8000),
          retry({ count: 1, delay: 300 }),
          finalize(async () => {
            if (showLoader) {
              await this.safeDismissLoading();
            }
            this.zoneFetchInFlight = false;

            if (this.queuedZoneFetchOptions) {
              const queuedOptions = this.queuedZoneFetchOptions;
              this.queuedZoneFetchOptions = null;
              this.getNearbyZones(queuedOptions);
            }
          })
        )
        .subscribe(async (res: any) => {

        if (res.statusCode === 200) {

          if (res.data.length === 0) {
            return this.showAlert(messageConstants.noZonesFound);
          }

          this.zones = res.data;
          this.zoneCache.set(cacheKey, { at: now, data: res.data });
          this.addEvegahZonesMarkers();

        } else if (res.statusCode === 422) {
          this.showAlert(messageConstants.noZonesFound);
        } else {
          this.showAlert(`Error in fetching your nearby zones: ${res.message}`);
        }
      }, () => {
        this.showAlert('Fetching zones is taking longer than expected. Please check network and try again.');
      })
    );

  }

  async addEvegahZonesMarkers() {
    const googleMaps: any = this.googleMaps;

    this.clearZoneMarkers();

    this.zones.forEach((zone) => {
      const zoneLocation = new googleMaps.LatLng(zone.latitude, zone.longitude);

      const marker = new googleMaps.Marker({
        position: zoneLocation,
        map: this.map,
        icon: {
          url: evegahZoneMarker.icon,
          scaledSize: new googleMaps.Size(evegahZoneMarker.sizeX, evegahZoneMarker.sizeY),
        },
      });

      marker.addListener('click', (mapsMouseEvent: any) => {
        this.handleMarkerClick(mapsMouseEvent, false, zone);
      });

      this.zoneMarkers.push(marker);
    });
  }

  private clearZoneMarkers() {
    this.zoneMarkers.forEach((marker: any) => {
      try {
        if (typeof marker?.setMap === 'function') {
          marker.setMap(null);
        } else {
          marker.map = null;
        }
      } catch {
        // ignore stale marker cleanup errors
      }
    });
    this.zoneMarkers = [];
  }

  addCurrentLocationMarker(location: any) {

    let googleMaps: any = this.googleMaps;

    const rideActiveIcon = {
      url: activeRideMarker.icon,
      scaledSize: new googleMaps.Size(activeRideMarker.sizeX, activeRideMarker.sizeY),
    };

    const icon = {
      url: currentLocationMarker.icon,
      scaledSize: new googleMaps.Size(currentLocationMarker.sizeX, currentLocationMarker.sizeY),
    };

    this.currentLocationMarker = new googleMaps.Marker({
      position: location,
      map: this.map,
      icon: this._rideActive === true ? rideActiveIcon : icon
    });

    this.currentLocationMarker.addListener('click', (mapsMouseEvent: any) => {
      this.handleMarkerClick(mapsMouseEvent, true);
    });

  }

  async handleMarkerClick(mapsMouseEvent: any, currentLocation: boolean, zone?: any) {

    if (this.activeZoneInfoPopup) {
      this.activeZoneInfoPopup.close();
    }

    let infoWindow = new google.maps.InfoWindow({
      position: mapsMouseEvent.latLng,
    });

    let infoWindowContent = `<div style='font-size: 14px; color: #333; font-weight: 500;'>Your current location</div>`;

    if (this.rideActive === true) {
      infoWindowContent = `<div style='font-size: 14px; color: #333; font-weight: 500;'>Your current ride</div>`;
    }

    if (currentLocation === false) {

      // draw path if any zone marker get clicked
      const zoneCoordinates = {
        lat: +zone.latitude,
        lng: +zone.longitude
      };
      const directionsData = await this.drawPolyline(zoneCoordinates);
      const routesData = directionsData.routes[0].legs[0];

      const vehiclesList = [...zone.avaialableBikeListData, ...zone.activeBikeListData, ...zone.underMantanceBikeListData];

      let infoWindowContainerStyles = `width:230px; color: #333; font-weight: 400; display: flex; flex-direction: column; row-gap: 5px; font-size: 13px`;
      const tableCellStyles = `border: 1px solid #ccc; padding: 3px;`;

      if (vehiclesList.length === 0) {
        infoWindowContainerStyles = `width:200px; color: #333; font-weight: 400; display: flex; flex-direction: column; row-gap: 5px; font-size: 13px`;
      }

      // show info window with following zone information, only on the click of zone marker.
      infoWindowContent = `
      <div style="${infoWindowContainerStyles}">
        <div style="font-size: 14px; font-weight: 500; text-transform: capitalize;">${zone.zoneName}</div>
        <p style="text-transform: capitalize;">${zone.zone_address}</p>
      `;

      if (vehiclesList.length === 0) {
        infoWindowContent += `
          <p style="font-weight: 500;">No Vehicles are available...</p>
        </div>
        `;
      } else {

        infoWindowContent += `
          <table style="margin-top: 10px;border-collapse: collapse;width: 100%; border: 1px solid #ccc;">
            <tr>
              <th style="${tableCellStyles}">Vehicle No.</th>
              <th style="${tableCellStyles}">Status</th>
            </tr>
          `;

        vehiclesList.map((vehicle) => {
          infoWindowContent += `
            <tr>
              <td style="${tableCellStyles}">${vehicle.lockNumber}</td>
              <td style="${tableCellStyles} text-transform: capitalize;">${vehicle.bikeStatusName} - ${!vehicle.batteryPercentage ? 'NA' : `${vehicle.batteryPercentage}%`}</td>
            </tr>
          `;
        });

        infoWindowContent += `
            </table>
          </div>
        `;

      }
    }

    infoWindow.setContent(infoWindowContent);
    infoWindow.open(this.map);
    this.activeZoneInfoPopup = infoWindow;

    // hide the location searchbox
    this.showSearchbox = false;
    this.stateManagementService.updateSearchboxStatus(false);

  }

  handleFindZonesByCurrentLocationControlClick() {

    const coordinates = this.currentLocation?.coords || this.fallbackMapCenter;
    const location = new this.googleMaps.LatLng(+coordinates.latitude, +coordinates.longitude);

    this.map.setCenter(location);
    this.map.setZoom(12);

    this.getCurrentAddress(location, true);

  }

  getCurrentAddress(location: any, shouldFetchZones: boolean = true, zoneFetchOptions: { showLoader?: boolean } = {}) {
    const lat = typeof location?.lat === 'function' ? location.lat() : location?.lat;
    const lng = typeof location?.lng === 'function' ? location.lng() : location?.lng;

    if (lat == null || lng == null || (typeof lat !== 'number') || (typeof lng !== 'number')) {
      this.currentAddress = { ...this.fallbackAddress };
      if (shouldFetchZones) {
        this.getNearbyZones(zoneFetchOptions);
      }
      return;
    }

    // Fast path: fallback coords = Vadodara, skip geocoding and fetch zones immediately
    if (lat != null && lng != null && Math.abs(lat - this.fallbackMapCenter.latitude) < 0.0001 &&
        Math.abs(lng - this.fallbackMapCenter.longitude) < 0.0001) {
      this.currentAddress = { ...this.fallbackAddress };
      if (shouldFetchZones) {
        this.getNearbyZones(zoneFetchOptions);
      }
      return;
    }

    // Fast path: use cached geocode result for same ~1km area
    const cacheKey = `${(lat ?? 0).toFixed(2)}_${(lng ?? 0).toFixed(2)}`;
    const cached = this.geocodeCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.at <= this.geocodeCacheDurationMs) {
      this.currentAddress = { country: cached.country, state: cached.state, city: cached.city };
      if (shouldFetchZones) {
        this.getNearbyZones(zoneFetchOptions);
      }
      return;
    }

    if (!this.geocoder) {
      this.currentAddress = { ...this.fallbackAddress };
      if (shouldFetchZones) {
        this.getNearbyZones(zoneFetchOptions);
      }
      return;
    }

    this.geocoder.geocode({ 'latLng': location }, (results: any, status: any) => {
      let country = null, city = null, state = null;

      if (status === 'OK' && results?.length !== 0) {
        let c, lc, component;

        for (let r = 0, rl = results.length; r < rl; r += 1) {
          const result = results[r];
          if (!result?.address_components) continue;

          if (!city && result.types?.[0] === 'locality') {
            for (c = 0, lc = result.address_components.length; c < lc; c += 1) {
              component = result.address_components[c];
              if (component?.types?.[0] === 'locality') {
                city = component.long_name;
                break;
              }
            }
          } else if (!city && (result.types?.[0] === 'administrative_area_level_2' || result.types?.[0] === 'sublocality_level_1')) {
            city = result.address_components[0]?.long_name || null;
          } else if (!state && result.types?.[0] === 'administrative_area_level_1') {
            for (c = 0, lc = result.address_components.length; c < lc; c += 1) {
              component = result.address_components[c];
              if (component?.types?.[0] === 'administrative_area_level_1') {
                state = component.long_name;
                break;
              }
            }
          } else if (!country && result.types?.[0] === 'country') {
            country = result.address_components[0]?.long_name || null;
          }

          if (city && country && state) break;
        }

        for (let r = 0; r < results.length; r += 1) {
          const comps = results[r]?.address_components || [];
          for (let i = 0; i < comps.length; i += 1) {
            const t = comps[i]?.types?.[0];
            if (t === 'country' && !country) country = comps[i].long_name;
            if (t === 'administrative_area_level_1' && !state) state = comps[i].long_name;
            if ((t === 'locality' || t === 'administrative_area_level_2') && !city) city = comps[i].long_name;
          }
          if (country && state && city) break;
        }
      }

      const address = {
        country: country || this.fallbackAddress.country,
        state: state || this.fallbackAddress.state,
        city: city || this.fallbackAddress.city
      };
      this.currentAddress = address;

      // Cache geocode result for faster repeat lookups
      const cacheKey = `${(lat ?? 0).toFixed(2)}_${(lng ?? 0).toFixed(2)}`;
      this.geocodeCache.set(cacheKey, { ...address, at: Date.now() });

      if (shouldFetchZones) {
        this.getNearbyZones(zoneFetchOptions);
      }
    });
  }

  getCountryStateCityForSearchedLocation(place: any) {

    let country = '', state = '', city = '';
    const addressComponents = place.address_components;

    addressComponents.map((component: any) => {

      if (component.types[0] === 'locality') {
        city = component.long_name;
      }

      if (!city && (component.types[0] === 'administrative_area_level_2' || component.types[0] === 'sublocality_level_1')) {
        city = component.long_name;
      }

      if (component.types[0] === 'administrative_area_level_1') {
        state = component.long_name;
      }

      if (component.types[0] === 'country') {
        country = component.long_name;
      }

    });

    return { country, state, city };

  }

  async drawPolyline(destination: any) {

    const coords = this._rideActive === true ? this.deviceCoordinates : this.currentLocation?.coords;

    const currentLocationCoordinates = {
      lat: +coords.latitude,
      lng: +coords.longitude
    };

    const _directionsData = await this.directionsService.route({
      origin: currentLocationCoordinates,
      destination: destination,
      travelMode: 'DRIVING',
      provideRouteAlternatives: true
    }, (response: any, status: any) => {

      if (status === 'OK') {
        this.directionsDisplay.setDirections(response);
      } else {
        this.showAlert('Directions request failed due to ' + status);
      }

    });

    return _directionsData;
  }

  async showAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Alert',
      message,
      buttons: ['OK'],
    });

    await alert.present();
  }

  private getCachedMapState(): { lat: number; lng: number; zoom: number } | null {
    try {
      const rawMapState = localStorage.getItem(this.lastMapStateStorageKey);
      if (!rawMapState) {
        return null;
      }

      const parsedMapState = JSON.parse(rawMapState);
      if (
        typeof parsedMapState?.lat !== 'number' ||
        typeof parsedMapState?.lng !== 'number'
      ) {
        return null;
      }

      return {
        lat: parsedMapState.lat,
        lng: parsedMapState.lng,
        zoom: typeof parsedMapState?.zoom === 'number' ? parsedMapState.zoom : 12
      };
    } catch {
      return null;
    }
  }

  private setMapPreview(lat?: number, lng?: number, zoom: number = 12) {
    const safeLat = typeof lat === 'number' ? lat : this.fallbackMapCenter.latitude;
    const safeLng = typeof lng === 'number' ? lng : this.fallbackMapCenter.longitude;
    const staticMapStyle = encodeURIComponent('feature:poi|visibility:off');
    const staticMarker = encodeURIComponent(`color:0x2A195C|${safeLat},${safeLng}`);
    const apiKey = environment.googleMapsAPIKey;

    this.lastMapPreviewUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${safeLat},${safeLng}&zoom=${zoom}&size=1080x1920&scale=2&maptype=roadmap&style=${staticMapStyle}&markers=${staticMarker}&key=${apiKey}`;

    try {
      localStorage.setItem(this.lastMapStateStorageKey, JSON.stringify({ lat: safeLat, lng: safeLng, zoom }));
    } catch {
      // Ignore storage errors.
    }
  }

  async showLoading(message: string) {
    await this.loadingController.create({
      message,
      cssClass: 'loader-css-class',
    }).then((response) => {
      response.present();
    });
  }

  private async safeDismissLoading() {
    try {
      await this.loadingController.dismiss();
    } catch (error) {
      // ignore: overlay may not exist
    }
  }

  ngOnDestroy(): void {
    this.subscription.forEach((subscription) => subscription.unsubscribe());
    this.safeDismissLoading();
    clearInterval(this.currentLocationInterval);
  }

}
