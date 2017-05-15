const env = process.env.LUCIFY_ENV === 'production' ? 'production' : 'staging';

module.exports = {
  REGION: 'eu-west-1',
  CLUSTER: 'minard-external',
  SERVICE: `minard-screenshotter-${env}`,
  CONTAINER: 'screenshotter',
  IMAGE: 'screenshotter',
  BUCKET: 'lucify-configuration',
  KEY: `ecs_services/screenshotter_${env}`,
  TASKDEFINITION_SOURCE: 'ecs-only',
};
