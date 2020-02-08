const { expect } = require('chai');
const { merger } = require('../src/pdf');
const { getLogger } = require('../src/logger');

process.env.PDF_BUCKET = 'pdf-bucket-test-us-west-2';
const logger = getLogger('pdf.spec');

describe('pdf', function() {
   it('should say hello', async function() {
      const result = await merger(
         {},
         {
            functionName: 'some-function',
            functionVersion: '1.0.0',
            awsRequestId: 'some-request-id'
         }
      );

      logger.info({ result });
   });
});
