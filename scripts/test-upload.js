const fs = require('fs');
const path = require('path');

async function testUpload() {
  // Create a 1x1 png buffer
  const base64Png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const buffer = Buffer.from(base64Png, 'base64');
  
  const blob = new Blob([buffer], { type: 'image/png' });
  const formData = new FormData();
  formData.append('file', blob, 'test.png');
  formData.append('folder', 'rada/test');

  const res = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  console.log("Upload result:", data);
}

testUpload().catch(console.error);
