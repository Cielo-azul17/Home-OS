import { Component, input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { environment } from '../../../../environments/environment';

declare global {
  interface Window {
    google: any;
  }
}

@Component({
  selector: 'app-map',
  standalone: true,
  template: `
    <div class="map-wrapper">
      <div #mapContainer class="map-container"></div>
      @if (routeInfo) {
        <div class="route-info">
          <div class="route-header">
            <div class="route-distance">📍 {{ routeInfo.distance }}</div>
            <div class="route-duration">⏱️ {{ routeInfo.duration }}</div>
          </div>
          <div class="route-instruction">{{ routeInfo.instruction }}</div>
        </div>
      }
    </div>
  `,
  styles: [`
    .map-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .map-container {
      width: 100%;
      height: 100%;
      border-radius: 8px;
      overflow: hidden;
    }

    .route-info {
      position: absolute;
      bottom: 12px;
      left: 12px;
      right: 12px;
      background: white;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      z-index: 10;
    }

    .route-header {
      display: flex;
      gap: 16px;
      margin-bottom: 8px;
      font-weight: 600;
      font-size: 14px;
      color: #1f2937;
    }

    .route-distance {
      color: #4b5563;
    }

    .route-duration {
      color: #10b981;
    }

    .route-instruction {
      font-size: 12px;
      color: #666;
      line-height: 1.4;
    }
  `]
})
export class Map implements AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  providerLocation = input.required<{ lat: number; lng: number }>();
  providerName = input.required<string>();
  address = input.required<string>();

  private map: any = null;
  private providerMarker: any = null;
  private userMarker: any = null;

  routeInfo: { distance: string; duration: string; instruction: string } | null = null;

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  private async initializeMap(): Promise<void> {
    // Load Google Maps API if not already loaded
    if (!window.google) {
      await this.loadGoogleMaps();
    }

    const location = this.providerLocation();
    const mapOptions: any = {
      zoom: 15,
      center: { lat: location.lat, lng: location.lng },
      mapTypeControl: true,
      zoomControl: true,
      fullscreenControl: true,
      streetViewControl: false,
    };

    const google = window.google;
    this.map = new google.maps.Map(this.mapContainer.nativeElement, mapOptions);

    // Add provider marker
    this.providerMarker = new google.maps.Marker({
      position: { lat: location.lat, lng: location.lng },
      map: this.map,
      title: this.providerName(),
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#ef4444',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
    });

    // Add info window for provider
    new google.maps.InfoWindow({
      content: `<div style="padding: 8px; font-size: 12px;"><strong>${this.providerName()}</strong><br/>${this.address()}</div>`,
      anchor: this.providerMarker,
    }).open(this.map);

    // Try to get user location and add marker
    this.addUserLocation();
  }

  private addUserLocation(): void {
    if (navigator.geolocation && this.map) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          const google = window.google;
          this.userMarker = new google.maps.Marker({
            position: userLocation,
            map: this.map!,
            title: 'Your Location',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });

          // Draw line between user and provider
          this.drawRoute(userLocation);
        },
        () => {
          // Fallback to Pune city center if geolocation fails
          this.drawRoute({ lat: 18.5204, lng: 73.8567 });
        }
      );
    }
  }

  private drawRoute(userLocation: { lat: number; lng: number }): void {
    if (!this.map) return;

    const google = window.google;
    const providerLocation = this.providerLocation();
    const polyline = new google.maps.Polyline({
      path: [userLocation, { lat: providerLocation.lat, lng: providerLocation.lng }],
      geodesic: true,
      strokeColor: '#3b82f6',
      strokeOpacity: 0.7,
      strokeWeight: 2,
      map: this.map,
    });

    // Calculate distance
    const distanceMeters = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(userLocation.lat, userLocation.lng),
      new google.maps.LatLng(providerLocation.lat, providerLocation.lng)
    );

    const distanceKm = (distanceMeters / 1000).toFixed(2);
    const estimatedMinutes = Math.round((distanceMeters / 1000) * 3); // Rough estimate: ~3 min per km

    // Set route info for display
    this.routeInfo = {
      distance: `${distanceKm} km`,
      duration: `~${estimatedMinutes} min (by car)`,
      instruction: `Head towards ${this.address()} for your service appointment.`,
    };

    // Fit bounds to show both locations
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(userLocation);
    bounds.extend(providerLocation);
    this.map.fitBounds(bounds, 50);
  }

  private loadGoogleMaps(): Promise<void> {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.getApiKey()}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }

  private getApiKey(): string {
    return environment.googleMapsApiKey;
  }
}
