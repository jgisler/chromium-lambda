const { S3 } = require('aws-sdk');
const pdftk = require('node-pdftk');
const { PassThrough } = require('stream');

const s3 = new S3();
const axios = require('axios').default;
const { getLogger, setContext } = require('./logger');

let logger;
exports.merger = async (event, context) => {
   setContext(context);
   logger = getLogger('merger');

   const pdfs = [
      ['geogratis.pdf', 'http://ftp.geogratis.gc.ca/pub/nrcan_rncan/publications/ess_sst/222/222861/mr_93_e.pdf'],
      ['flightPlan.pdf', 'https://www.hq.nasa.gov/alsj/a17/A17_FlightPlan.pdf']
   ];

   // const downloadResults = await Promise.all(
   //    pdfs.map(pdf => {
   //       const [filename, url] = pdf;
   //       return getPdf(filename, url);
   //    })
   // );

   return await mergePdfs('geogratis.pdf', 'flightPlan.pdf');
};

async function mergePdfs(...keys) {
   try {
      const pdfBuffers = await Promise.all(keys.map(key => getObjectContent(key)));
      await pdftk.input(pdfBuffers).output('./experience.pdf');
   } catch (error) {
      logger.error({ mergePdfs: { keys, error } });
      throw error;
   }
}

function getObjectStream(key) {
   const params = { Key: key, Bucket: process.env.PDF_BUCKET };
   return s3.getObject(params).createReadStream();
}

async function getObjectContent(key) {
   const params = { Key: key, Bucket: process.env.PDF_BUCKET };
   const s3Result = await s3
      .getObject(params)
      .promise()
      .catch(error => {
         throw new AwsError(error);
      });

   return s3Result.Body;
}

async function getPdf(filename, url) {
   const response = await axios({ method: 'get', url: url, responseType: 'stream' });
   const s3UploadResult = await s3Upload(filename, response.data);
   logger.info({ s3UploadResult });
}

function s3Upload(filename, stream) {
   const params = { Body: stream, Key: filename, Bucket: process.env.PDF_BUCKET };
   const options = { partSize: 5 * 1024 * 1024, queueSize: 4 };
   return new Promise((resolve, reject) => {
      s3.upload(params, options, (err, data) => {
         if (err) {
            logger.error({ s3Upload: { filename, err } });
            reject(new AwsError(err));
         }
         resolve(data);
      }).on('httpUploadProgress', progress => {
         const { key, loaded } = progress;
         const uploaded = `${Math.ceil(loaded / 1024 / 1024)}MB`;
         logger.info({ key, uploaded });
      });
   });
}

class AwsError extends Error {
   constructor(error) {
      super(error);
      this.name = this.constructor.name;
      Error.captureStackTrace(error);
   }
}
