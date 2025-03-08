import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export default (scope: Construct, lambda: NodejsFunction) => {
  lambda.addEnvironment('FOR_ALL', 'test');
};
