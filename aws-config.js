import { AWS } from 'aws-sdk/dist/aws-sdk-react-native';

const awsConfig = {
  accessKeyId: 'test',
  secretAccessKey: 'test',
  region: 'mumbai',
  bucket: 'img',
};

AWS.config.update({
  accessKeyId: awsConfig.accessKeyId,
  secretAccessKey: awsConfig.secretAccessKey,
  region: awsConfig.region,
});

const s3 = new AWS.S3();

export { s3, awsConfig };
