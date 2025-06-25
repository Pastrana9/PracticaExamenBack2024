// utils.ts
import { GraphQLError } from 'graphql';
import {
  API_Phone,
  API_Country,
  API_City,
  API_WorldTime,
} from './type.ts';

const API_KEY = Deno.env.get('API_KEY');
if (!API_KEY) throw new Error('Error con la API_KEY');

/* ---------- 1) Validar teléfono ---------- */
export const validatePhone = async (telefono: string) => {
  const url =
    `https://api.api-ninjas.com/v1/validatephone?number=${encodeURIComponent(
      telefono,
    )}`;
  const res = await fetch(url, { headers: { 'X-Api-Key': API_KEY } });
  if (res.status !== 200) throw new GraphQLError('Fallo al solicitar validatephone');
  const data: API_Phone = await res.json();
  return { is_valid: data.is_valid, pais: data.country };
};

/* ---------- 2) Capital + ISO-2 ---------- */
export const getCapital = async (countryName: string) => {
  const url =
    `https://api.api-ninjas.com/v1/country?name=${encodeURIComponent(
      countryName,
    )}`;
  const res = await fetch(url, { headers: { 'X-Api-Key': API_KEY } });
  if (res.status !== 200) throw new GraphQLError('Fallo al solicitar country');
  const data: API_Country[] = await res.json();
  if (!data?.length) throw new GraphQLError('País no encontrado');
  return {
    capital: data[0].capital,
    iso2: data[0].iso2,
  };
};

/* ---------- 3) Lat / Lon de la capital (sin filtro de país ni limit) ---------- */
export const getLatLon = async (city: string) => {
  const url =
    `https://api.api-ninjas.com/v1/city?name=${encodeURIComponent(city)}`;
  const res = await fetch(url, { headers: { 'X-Api-Key': API_KEY } });

  if (res.status !== 200) {
    const txt = await res.text();
    throw new GraphQLError(
      `Fallo al solicitar city (status ${res.status}): ${txt}`,
    );
  }

  const data: API_City[] = await res.json();
  if (!data?.length) throw new GraphQLError('Capital no encontrada');
  return { lat: data[0].latitude, lon: data[0].longitude };
};

/* ---------- 4) Hora local HH:MM ---------- */
export const getLocalTime = async (lat: number, lon: number) => {
  const url = `https://api.api-ninjas.com/v1/worldtime?lat=${lat}&lon=${lon}`;
  const res = await fetch(url, { headers: { 'X-Api-Key': API_KEY } });
  if (res.status !== 200) throw new GraphQLError('Fallo al solicitar worldtime');
  const data: API_WorldTime = await res.json();
  const h = data.hour.toString().padStart(2, '0');
  const m = data.minute.toString().padStart(2, '0');
  return `${h}:${m}`;
};