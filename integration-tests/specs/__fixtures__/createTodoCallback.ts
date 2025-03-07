import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import callback from './[shared]Callback';

export default (scope: Construct, lambda: NodejsFunction) => {
  lambda.addEnvironment('FOR_CREATE_TODO', 'test');
  callback(scope, lambda);
};
