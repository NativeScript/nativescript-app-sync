function getProjectData ($injector, hookArgs) {
  if (hookArgs && hookArgs.projectData) {
    // CLI 5.4.x or older
    return hookArgs.projectData;
  }

  // CLI 6.0.0 and later
  const projectDir = hookArgs && hookArgs.prepareData && hookArgs.prepareData.projectDir;
  const $projectDataService = $injector.resolve('projectDataService')
  const projectData = $projectDataService.getProjectData(projectDir);
  return projectData;
}

module.exports.getPlatformFromPrepareHookArgs = function (hookArgs) {
  const platform = (hookArgs && (hookArgs.platform || (hookArgs.prepareData && hookArgs.prepareData.platform)) || '').toLowerCase();
  return platform;
}

module.exports.getNativeProjectDir = function ($injector, platform, hookArgs) {
  let service = null;
  try {
    // CLI 6.0.0 and later
    service = $injector.resolve('platformsDataService');
  } catch (err) {
    // CLI 5.4.x and below:
    service = $injector.resolve('platformsData');
  }

  const projectData = getProjectData($injector, hookArgs);
  const platformData = service.getPlatformData(platform, projectData);

  return platformData.projectRoot;
}