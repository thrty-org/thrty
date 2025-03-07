import { LambdaEndpoint } from '@thrty/api-cdk';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

export default class extends LambdaEndpoint {
  override createFunction() {
    const stage = String(process.env.NODE_ENV);
    return new NodejsFunction(this, 'Lambda', {
      functionName: `${stage.charAt(0).toUpperCase()}${stage.slice(1)}${this.props.name}`,
      entry: this.props.path,
      runtime: Runtime.NODEJS_20_X,
      environment: {
        FOR_GET_TODOS: 'test',
      },
    });
  }
}
