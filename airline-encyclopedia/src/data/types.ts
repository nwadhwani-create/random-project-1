export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

export interface Route {
  from: Airport;
  to: Airport;
}

export interface AircraftType {
  model: string;
  manufacturer: string;
  count: number;
  passengers: string;
  range: string;
  imageUrl: string;
  imageAlt: string;
  description: string;
}

export interface Airline {
  slug: string;
  name: string;
  iataCode: string;
  icaoCode: string;
  country: string;
  founded: number;
  headquarters: string;
  alliance: string;
  logoColor: string;
  accentColor: string;
  history: string;
  fleet: AircraftType[];
  hubs: Airport[];
  routes: Route[];
}
