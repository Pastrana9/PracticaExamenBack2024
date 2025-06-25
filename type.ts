// type.ts
import { OptionalId } from 'mongodb';

/* ===== Modelo Mongo ===== */
export type ContactModel = OptionalId<{
  nombre: string;
  telefono: string;
  pais: string;   // nombre legible («Spain»)
  iso2: string;   // código ISO-2 («ES») – interno
  capital: string;
  hora_capital: string; // HH:MM
}>;

/* ===== Tipos API Ninjas ===== */
export type API_Phone   = { is_valid: boolean; country: string };
export type API_Country = { name: string; capital: string; iso2: string };
export type API_City    = { latitude: number; longitude: number };
export type API_WorldTime = { hour: number; minute: number };
