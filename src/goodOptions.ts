
export const defaultGoodOptions = {
  reporters: {
    console: [
      {
        module: 'good-squeeze',
        name: 'Squeeze',
        args: [
          {
            log: '*',
            response: '*',
            error: '*',
          },
        ],
      },
      {
        module: 'good-console',
      },
      'stdout',
    ],
  },
};
