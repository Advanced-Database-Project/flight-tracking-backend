import axios from "axios";
import env from "../../../shared/env.js";

// OpenSky REST API
//   docs: https://openskynetwork.github.io/opensky-api/rest.html
//   auth: OAuth2 client_credentials (Keycloak-backed)
const API_BASE = "https://opensky-network.org/api";
const TOKEN_URL =
  "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";

// Cache one token in memory; refresh ~30s before expiry.
let cachedToken = null;

async function getAccessToken() {
  const id = env.OPENSKY_CLIENT_ID;
  const secret = env.OPENSKY_CLIENT_SECRET;
  if (!id || !secret) return null;

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt - 30_000 > now) {
    return cachedToken.value;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: id,
    client_secret: secret,
  });

  const { data } = await axios.post(TOKEN_URL, body.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 10_000,
  });

  cachedToken = {
    value: data.access_token,
    expiresAt: now + (data.expires_in ?? 1800) * 1000,
  };
  return cachedToken.value;
}

// OpenSky returns each aircraft as a positional array. Map to named fields.
function mapState(s) {
  return {
    icao24: s[0],
    callsign: (s[1] || "").trim(),
    originCountry: s[2],
    timePosition: s[3],
    lastContact: s[4],
    longitude: s[5],
    latitude: s[6],
    baroAltitude: s[7],
    onGround: s[8],
    velocity: s[9],
    heading: s[10],
    verticalRate: s[11],
    geoAltitude: s[13],
    squawk: s[14],
    trueTrack: s[10],
  };
}

export async function fetchStates(bbox) {
  const token = await getAccessToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const params = {};
  if (
    bbox &&
    [bbox.lamin, bbox.lomin, bbox.lamax, bbox.lomax].every(Number.isFinite)
  ) {
    params.lamin = bbox.lamin;
    params.lomin = bbox.lomin;
    params.lamax = bbox.lamax;
    params.lomax = bbox.lomax;
  }

  const { data } = await axios.get(`${API_BASE}/states/all`, {
    headers,
    params,
    timeout: 20_000,
  });

  return (data.states || []).map(mapState);
}
