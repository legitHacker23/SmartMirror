import axios from 'axios';

const tz = "America/Chicago";

export async function getTime() {
  const res = await axios.get('https://api.api-ninjas.com/v1/worldtime?timezone=' + tz, {
    headers: { 'X-Api-Key': 'CmTKS7v/n2GdyQ8v6Ei3vg==QAhm2cItJyVvunQK'}
  });
  // console.log(res.data);
  return res.data;
};
