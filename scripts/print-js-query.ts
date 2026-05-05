import axios from 'axios';

async function main() {
  const url = "https://static.xx.fbcdn.net/rsrc.php/v4i76K4/yp/l/id_ID-j/rKREzvAgLQaZMhPHOOfrzcP8I5uB7qQiitX3YfDooFp6E6lPbOxE0I6h4qwzfoTKmXXrvAeohR3TfdFVwQmnkiQE568Mg_mNghEKtBR9hbxt-HZZwgJ2lf1Earkq0_YqSmI-f5gLS1x8i4gZmEzfgzVYrIYx6KUp5tC6aOMkH-5-X5wOOAp3A2_mq9OlV-pnBum19mR5LXWJ3H7I_h2fld_48sTVRi7mWBMSxEc1Sg-LWi9jnDz-zAP6IobUEmOVT29frHHKu5w1_SIDr9PG2VZBH_yP1m-4pRJfhz3MsaWR1yPI6oXcDj4lasAjfQ6y1TlicnN5Jg.js?_nc_eui2=AeHAjcTCbm_CqBC3oOO8XV7hzHLdULMhDLjMct1QsyEMuOVWLxDqC5qMUBcM6Bi7a8STcSAeN_DgGmdl92WIGKxx";
  const res = await axios.get(url);
  const js = res.data as string;
  const idx = js.indexOf('CometNotificationsDropdownQuery');
  if (idx !== -1) {
    console.log(js.substring(idx, idx + 300));
  }
}
main();
