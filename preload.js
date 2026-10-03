const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('appInfo', {
  name: 'VoxelCraft',
  version: '1.0.0',
  platform: process.platform
});
