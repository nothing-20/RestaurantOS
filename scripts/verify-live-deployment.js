import https from 'https';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function verifyLive() {
  console.log('Fetching live index from https://restaurant-os-dun.vercel.app ...');
  const index = await fetchUrl('https://restaurant-os-dun.vercel.app/');
  console.log('HTTP Status:', index.status);
  
  // Find script tags
  const matches = [...index.data.matchAll(/src="([^"]+)"/g)].map(m => m[1]);
  console.log('Referenced scripts:', matches);
  
  // Also check StaffActivate chunk directly:
  const staffChunk = 'https://restaurant-os-dun.vercel.app/assets/StaffActivate-Oh0v2sJI.js';
  console.log('Fetching live StaffActivate chunk:', staffChunk);
  const chunkRes = await fetchUrl(staffChunk);
  console.log('StaffActivate Chunk Status:', chunkRes.status);
  const containsIdSearch = chunkRes.data.includes('id');
  const containsGuidance = chunkRes.data.includes('missing the Invitation ID parameter');
  console.log('Contains id search logic:', containsIdSearch);
  console.log('Contains missing id guidance:', containsGuidance);

  // Check OwnerStaffManager chunk
  const ownerStaffChunk = 'https://restaurant-os-dun.vercel.app/assets/OwnerStaffManager-DNHAUs14.js';
  console.log('Fetching live OwnerStaffManager chunk:', ownerStaffChunk);
  const ownerRes = await fetchUrl(ownerStaffChunk);
  console.log('OwnerStaffManager Chunk Status:', ownerRes.status);
  const containsDiagnostic = ownerRes.data.includes('[StaffInvitation] Created');
  console.log('Contains [StaffInvitation] Created diagnostic:', containsDiagnostic);
}

verifyLive().catch(console.error);
