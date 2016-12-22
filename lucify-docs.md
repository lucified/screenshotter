
# Lucify-specific documentation

## Deployment

### Locally

Local deployments require that:
- Valid AWS credentials are in place.
- [ecs-updater](https://github.com/lucified/ecs-updater) is installed globally
- [lucify-notified](https://github.com/lucified/lucify-notifier) is installed globally

Install ecs-updater and lucify-notifier globally with
```bash
npm install -g ecs-updater lucify-notifier
```

Deploy to staging with
```bash
LUCIFY_ENV=staging lucify-notifier ecs-updater
```

Deploy to production with
```bash
LUCIFY_ENV=production lucify-notifier ecs-updater
```

### Continous integration

Once pull requests are merged to the `master` branch
in GitHub, on the condition that the tests pass, CircleCI
will deploy to staging automatically.

### Chatops

Chatops deployments are supported.

## Restart

Restart `screenshotter` in staging with
```bash
ecs-updater -s restart-terraform
```
Restart `screenshotter` in production with
```bash
LUCIFY_ENV=production ecs-updater -s restart-terraform
```

