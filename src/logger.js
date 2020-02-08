const { createLogger, format, transports } = require('winston');
const { colorize, combine, simple, errors, label, json, printf, timestamp, ms } = format;
const { Console } = transports;

const metaData = {
   appname: null,
   version: null,
   requestId: null
};

const formatter = info =>
   `${info.timestamp} ${info.appname}-${info.version} ${info.requestId} class=${info.name} ` +
   `severity=${info.level} ${info.ms} | ${JSON.stringify(info.message)}`;

const logger = createLogger({
   level: 'info',
   format: combine(
      ms(),
      timestamp(),
      errors({ stack: true }),
      printf(info => formatter(info))
   ),
   exitOnError: false,
   defaultMeta: metaData,
   transports: [new Console({ handleExceptions: true })]
});

module.exports.getLogger = name => {
   return logger.child({ name });
};

module.exports.setContext = context => {
   if (context !== undefined) {
      metaData.appname = context.functionName || null;
      metaData.version = context.functionVersion || null;
      metaData.requestId = context.awsRequestId || null;
   }
};
