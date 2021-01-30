const configuration = {
  title: 'NestJS Status', // Default title
  path: '/status',
  socketPath: '/socket.io', // In case you use a custom path
  port: null,
  spans: [
    {
      interval: 1, // Every second
      retention: 60, // Keep 60 datapoints in memory
    },
    {
      interval: 5, // Every 5 seconds
      retention: 60,
    },
    {
      interval: 15, // Every 15 seconds
      retention: 60,
    },
  ],
  chartVisibility: {
    cpu: true,
    mem: true,
    load: true,
    eventLoop: true,
    heap: true,
    responseTime: true,
    rps: true,
    statusCodes: true,
  },
  healthChecks: [],
  ignoreStartsWith: ['/admin'],
};

export default configuration;
