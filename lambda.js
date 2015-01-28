console.log('Loading event');
var aws = require('aws-sdk');

function createCloudFormationStack(key, url, onCompletion, context) {
    var stackName = key.match(/\/(.*).json$/)[1];
    console.log('Creating CloudFormation client')
    var cloudformation = new aws.CloudFormation({
        apiVersion: '2010-05-15',
        region: 'us-east-1'
    });
    var params = {
        StackName: stackName,
        TemplateURL: url,
        Tags: [ {
            "Key" : "Name",
            "Value" : stackName
        }, {
            "Key" : "Template",
            "Value" : key
        }, {
            "Key" : "CreatedBy",
            "Value" : "LambdaCloudformationRunner"
        }]

    }

    console.log('CreateStack with Params')
    cloudformation.createStack(params, function(err, data) {
      if (err) {
          console.log(err, err.stack); // an error occurred
      } else {
          console.log('CreateStack succeed - now watch progress in CloudFormation console')
          console.log(data);           // successful response
      }
      onCompletion(context)
    });
}

function cleanup(context) {
    console.log('Cleaning up context')
    context.done(null,'');
}

exports.handler = function(event, context) {
   var s3 = new aws.S3({apiVersion: '2006-03-01'});

   console.log('Received event:');
   console.log(JSON.stringify(event, null, '  '));

   // Get the object from the event and show its content type
   var bucket = event.Records[0].s3.bucket.name;
   var key = event.Records[0].s3.object.key;

   //only pickup files when key starts with ‘cloudformation' and ends with ‘.json'
   if ((/^cloudformation\//).test(key) && (/.json$/).test(key)) {
        createCloudFormationStack(key,
                                  'http://s3.amazonaws.com/' + bucket + '/' + key,
                                  cleanup,
                                  context);
   } else {
       console.log("File is not a cloudformation template (expecting key like cloudformation/*.json)");
       cleanup(context)
   }

};
